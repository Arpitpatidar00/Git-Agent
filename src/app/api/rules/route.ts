import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

interface SessionWithToken {
  accessToken: string;
  user: {
    githubId: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

/**
 * GET — List rules for a repo.
 * Query params: repoId (required)
 */
export async function GET(request: NextRequest) {
  const session = (await getServerSession(authOptions)) as SessionWithToken | null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const repoId = searchParams.get("repoId");

  if (!repoId) {
    return NextResponse.json(
      { error: "repoId is required" },
      { status: 400 }
    );
  }

  // Verify the repo belongs to this user
  const user = await prisma.user.findUnique({
    where: { githubId: session.user.githubId },
  });

  const repo = await prisma.repo.findFirst({
    where: { id: repoId, userId: user?.id },
  });

  if (!repo) {
    return NextResponse.json({ error: "Repo not found" }, { status: 404 });
  }

  const rules = await prisma.rule.findMany({
    where: { repoId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ rules });
}

/**
 * POST — Create a new rule for a repo.
 */
export async function POST(request: NextRequest) {
  const session = (await getServerSession(authOptions)) as SessionWithToken | null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    repoId,
    eventType,
    matchField,
    matchOperator,
    matchValue,
    actionType,
    actionValue,
  } = body;

  // Validate required fields
  if (
    !repoId ||
    !eventType ||
    !matchField ||
    !matchOperator ||
    !matchValue ||
    !actionType ||
    !actionValue
  ) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  // Verify repo ownership
  const user = await prisma.user.findUnique({
    where: { githubId: session.user.githubId },
  });

  const repo = await prisma.repo.findFirst({
    where: { id: repoId, userId: user?.id },
  });

  if (!repo) {
    return NextResponse.json({ error: "Repo not found" }, { status: 404 });
  }

  const rule = await prisma.rule.create({
    data: {
      repoId,
      eventType,
      matchField,
      matchOperator,
      matchValue,
      actionType,
      actionValue,
    },
  });

  return NextResponse.json({ rule }, { status: 201 });
}

/**
 * PUT — Update a rule.
 */
export async function PUT(request: NextRequest) {
  const session = (await getServerSession(authOptions)) as SessionWithToken | null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json(
      { error: "Rule id is required" },
      { status: 400 }
    );
  }

  // Verify ownership through the rule → repo → user chain
  const user = await prisma.user.findUnique({
    where: { githubId: session.user.githubId },
  });

  const existingRule = await prisma.rule.findFirst({
    where: { id },
    include: { repo: true },
  });

  if (!existingRule || existingRule.repo.userId !== user?.id) {
    return NextResponse.json({ error: "Rule not found" }, { status: 404 });
  }

  const rule = await prisma.rule.update({
    where: { id },
    data: updates,
  });

  return NextResponse.json({ rule });
}

/**
 * DELETE — Delete a rule.
 */
export async function DELETE(request: NextRequest) {
  const session = (await getServerSession(authOptions)) as SessionWithToken | null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json(
      { error: "Rule id is required" },
      { status: 400 }
    );
  }

  // Verify ownership
  const user = await prisma.user.findUnique({
    where: { githubId: session.user.githubId },
  });

  const existingRule = await prisma.rule.findFirst({
    where: { id },
    include: { repo: true },
  });

  if (!existingRule || existingRule.repo.userId !== user?.id) {
    return NextResponse.json({ error: "Rule not found" }, { status: 404 });
  }

  await prisma.rule.delete({ where: { id } });

  return NextResponse.json({ message: "Rule deleted" });
}
