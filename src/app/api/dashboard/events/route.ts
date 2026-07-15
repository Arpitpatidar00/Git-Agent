import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
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
 * GET — Fetch events for the dashboard with ActionLog join.
 * Query params: repoId (optional), limit (optional, default 50)
 */
export async function GET(request: NextRequest) {
  const session = (await getServerSession(authOptions)) as SessionWithToken | null;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const repoId = searchParams.get("repoId");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const skip = (page - 1) * limit;

  const user = await prisma.user.findUnique({
    where: { githubId: session.user.githubId },
    include: { repos: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const repoIds = repoId
    ? [repoId]
    : user.repos.map((r) => r.id);

  const events = await prisma.event.findMany({
    where: { repoId: { in: repoIds } },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit + 1,
    include: {
      actions: {
        orderBy: { createdAt: "desc" },
      },
      repo: {
        select: { fullName: true },
      },
    },
  });

  const hasNextPage = events.length > limit;
  const paginatedEvents = hasNextPage ? events.slice(0, limit) : events;
  const nextPage = hasNextPage ? page + 1 : null;

  // Stats (always calculate total status count across all events for the repo context, not just the page)
  const stats = await prisma.event.groupBy({
    by: ["status"],
    where: { repoId: { in: repoIds } },
    _count: true,
  });

  return NextResponse.json({ events: paginatedEvents, nextPage, stats, repos: user.repos });
}

