import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { RulesView } from "../../../modules/rules";
import { getAuthSession } from "@/lib/auth/session";

export default async function Page() {
  const session = await getAuthSession();
  if (!session) {
    redirect("/");
  }

  const queryClient = new QueryClient();

  let activeRepoId = "";

  // Prefetch dashboardData (contains connected repos)
  await queryClient.prefetchQuery({
    queryKey: ["rulesDashboardData"],
    queryFn: async () => {
      const user = await prisma.user.findUnique({
        where: { githubId: session.user.githubId },
        include: { repos: true },
      });

      if (!user) {
        return { events: [], stats: [], repos: [] };
      }

      if (user.repos.length > 0) {
        activeRepoId = user.repos[0].id;
      }

      return JSON.parse(
        JSON.stringify({
          events: [],
          stats: [],
          repos: user.repos,
        })
      );
    },
  });

  // Prefetch rules for the first active repo if exists
  if (activeRepoId) {
    await queryClient.prefetchQuery({
      queryKey: ["rules", activeRepoId],
      queryFn: async () => {
        const rules = await prisma.rule.findMany({
          where: { repoId: activeRepoId },
          orderBy: { createdAt: "desc" },
        });
        return JSON.parse(JSON.stringify({ rules }));
      },
    });
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RulesView />
    </HydrationBoundary>
  );
}
