import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/github/verify";
import { enqueueEvent } from "@/lib/jobs/enqueue";
import { prisma } from "@/lib/db/prisma";

/**
 * GitHub Webhook handler.
 *
 * THIN — verification + enqueue only. All actual side effects
 * (GitHub write, Slack post) happen in the worker.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    console.error("GITHUB_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Server misconfiguration" },
      { status: 500 }
    );
  }

  // 1. Read raw body for signature verification
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256") || "";
  const deliveryId = request.headers.get("x-github-delivery") || "";
  const eventType = request.headers.get("x-github-event") || "";

  // 2. Verify HMAC signature — reject forged requests
  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 }
    );
  }

  // 3. Parse payload
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  // 4. Handle ping event (sent when webhook is first created)
  if (eventType === "ping") {
    return NextResponse.json({ message: "pong" }, { status: 200 });
  }

  // 5. Look up the repo
  const repoFullName = (
    payload.repository as Record<string, unknown> | undefined
  )?.full_name as string | undefined;

  if (!repoFullName) {
    return NextResponse.json(
      { error: "Missing repository info in payload" },
      { status: 400 }
    );
  }

  const repo = await prisma.repo.findFirst({
    where: { fullName: repoFullName },
  });

  if (!repo) {
    // We received a webhook for a repo we don't track — ignore
    return NextResponse.json(
      { message: "Repo not tracked" },
      { status: 200 }
    );
  }

  // 6. Enqueue the event (idempotency handled by unique constraint on deliveryId)
  const action = (payload.action as string) || null;
  const event = await enqueueEvent(
    repo.id,
    eventType,
    action,
    payload,
    deliveryId
  );

  if (event === null) {
    // Duplicate delivery — already processed, return 200 without reprocessing
    return NextResponse.json(
      { message: "Event already received" },
      { status: 200 }
    );
  }

  // In development mode, trigger the worker asynchronously in the background
  // so the user doesn't have to hit /api/jobs/run manually.
  if (process.env.NODE_ENV === "development") {
    import("@/lib/jobs/worker").then(({ processJobs }) => {
      processJobs().catch((err) =>
        console.error("Failed to run background development worker:", err)
      );
    });
  }

  // 7. Return 200 fast — worker will process asynchronously
  return NextResponse.json(
    { message: "Event queued", eventId: event.id },
    { status: 200 }
  );
}
