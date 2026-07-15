import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createOctokitClient } from "@/lib/github/client";
import { WEBHOOK_EVENTS } from "@/constants";
import { getAuthSession, getServerAccessToken } from "@/lib/auth/session";

/**
 * GET — List the authenticated user's GitHub repos.
 */
export async function GET() {
  const session = await getAuthSession();
  const accessToken = await getServerAccessToken();
  if (!session || !accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const octokit = createOctokitClient(accessToken);
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      sort: "updated",
      per_page: 100,
      type: "owner",
    });

    // Also get connected repos from our DB
    const user = await prisma.user.findUnique({
      where: { githubId: session.user.githubId },
      include: { repos: true },
    });

    const connectedRepoNames = new Set(
      user?.repos.map((r) => r.fullName) || [],
    );

    const repoList = repos.map((repo) => ({
      fullName: repo.full_name,
      description: repo.description,
      private: repo.private,
      connected: connectedRepoNames.has(repo.full_name),
    }));

    return NextResponse.json({ repos: repoList });
  } catch (error) {
    console.error("Error fetching repos:", error);
    return NextResponse.json(
      { error: "Failed to fetch repos" },
      { status: 500 },
    );
  }
}

/**
 * POST — Connect a repo: store in DB + create GitHub webhook.
 */
export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  const accessToken = await getServerAccessToken(request);
  if (!session || !accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { fullName } = body as { fullName: string };

  if (!fullName || !fullName.includes("/")) {
    return NextResponse.json(
      { error: "Invalid repo name — expected 'owner/repo'" },
      { status: 400 },
    );
  }

  const [owner, repo] = fullName.split("/");

  try {
    // Get user from DB
    const user = await prisma.user.findUnique({
      where: { githubId: session.user.githubId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already connected
    const existingRepo = await prisma.repo.findUnique({
      where: { userId_fullName: { userId: user.id, fullName } },
    });

    if (existingRepo) {
      return NextResponse.json(
        { error: "Repo already connected" },
        { status: 409 },
      );
    }

    // Create webhook on GitHub
    const octokit = createOctokitClient(accessToken);
    const webhookUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/github`;
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

    let webhookId: number | null = null;
    let warning: string | undefined = undefined;

    try {
      const { data: webhook } = await octokit.repos.createWebhook({
        owner,
        repo,
        config: {
          url: webhookUrl,
          content_type: "json",
          secret: webhookSecret,
          insecure_ssl: "0",
        },
        events: [...WEBHOOK_EVENTS],
        active: true,
      });
      webhookId = webhook.id;
    } catch (err: any) {
      console.warn("Failed to register GitHub webhook:", err.message);
      // If it failed because of localhost (422), allow the repo to connect in DB for local development
      if (
        webhookUrl.includes("localhost") ||
        webhookUrl.includes("127.0.0.1")
      ) {
        warning =
          "Repository connected locally, but GitHub webhook was skipped because localhost is not publicly reachable.";
      } else {
        throw err;
      }
    }

    // Store repo in DB
    const newRepo = await prisma.repo.create({
      data: {
        userId: user.id,
        fullName,
        webhookId,
      },
    });

    return NextResponse.json({
      message: "Repo connected",
      repo: { id: newRepo.id, fullName: newRepo.fullName },
      warning,
    });
  } catch (error) {
    console.error("Error connecting repo:", error);
    // SECURITY: Never expose internal error details to the client
    return NextResponse.json(
      { error: "Failed to connect repo" },
      { status: 500 },
    );
  }
}

/**
 * DELETE — Disconnect a repo: remove webhook + delete from DB.
 */
export async function DELETE(request: NextRequest) {
  const session = await getAuthSession();
  const accessToken = await getServerAccessToken(request);
  if (!session || !accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { fullName } = body as { fullName: string };

  if (!fullName || !fullName.includes("/")) {
    return NextResponse.json({ error: "Invalid repo name" }, { status: 400 });
  }

  const [owner, repo] = fullName.split("/");

  try {
    const user = await prisma.user.findUnique({
      where: { githubId: session.user.githubId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existingRepo = await prisma.repo.findUnique({
      where: { userId_fullName: { userId: user.id, fullName } },
    });

    if (!existingRepo) {
      return NextResponse.json({ error: "Repo not found" }, { status: 404 });
    }

    // Remove webhook from GitHub
    if (existingRepo.webhookId) {
      try {
        const octokit = createOctokitClient(accessToken);
        await octokit.repos.deleteWebhook({
          owner,
          repo,
          hook_id: existingRepo.webhookId,
        });
      } catch {
        // Webhook may already be deleted — continue with DB cleanup
        console.warn(
          `Failed to delete webhook ${existingRepo.webhookId} from ${fullName}`,
        );
      }
    }

    // Delete from DB (cascade deletes rules and events)
    await prisma.repo.delete({ where: { id: existingRepo.id } });

    return NextResponse.json({ message: "Repo disconnected" });
  } catch (error) {
    console.error("Error disconnecting repo:", error);
    return NextResponse.json(
      { error: "Failed to disconnect repo" },
      { status: 500 },
    );
  }
}
