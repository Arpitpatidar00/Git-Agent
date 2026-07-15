import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { DashboardView } from "../../modules/dashboard";
import { getAuthSession } from "@/lib/auth/session";

export default async function Page() {
  const session = await getAuthSession();
  if (!session) {
    redirect("/");
  }

  const queryClient = new QueryClient();

  await queryClient.prefetchInfiniteQuery({
    queryKey: ["dashboardEvents"],
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => lastPage.nextPage,
    queryFn: async ({ pageParam }) => {
      const user = await prisma.user.findUnique({
        where: { githubId: session.user.githubId },
        include: { repos: true },
      });

      if (!user) {
        return { events: [], nextPage: null, stats: [], repos: [] };
      }

      const repoIds = user.repos.map((r) => r.id);
      const limit = 20;
      const skip = ((pageParam as number) - 1) * limit;

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
      const nextPage = hasNextPage ? (pageParam as number) + 1 : null;

      const stats = await prisma.event.groupBy({
        by: ["status"],
        where: { repoId: { in: repoIds } },
        _count: true,
      });

      return JSON.parse(
        JSON.stringify({
          events: paginatedEvents,
          nextPage,
          stats,
          repos: user.repos,
        })
      );
    },
  });


  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardView />
    </HydrationBoundary>
  );
}
