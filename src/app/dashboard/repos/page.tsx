import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { prisma } from "@/lib/db/prisma";
import { createOctokitClient } from "@/lib/github/client";
import { redirect } from "next/navigation";
import { ReposView } from "../../../modules/repos";
import { getAuthSession, getServerAccessToken } from "@/lib/auth/session";

export default async function Page() {
  const session = await getAuthSession();
  const accessToken = await getServerAccessToken();
  if (!session || !accessToken) {
    redirect("/");
  }

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["repos"],
    queryFn: async () => {
      try {
        const octokit = createOctokitClient(accessToken);
        const { data: repos } = await octokit.repos.listForAuthenticatedUser({
          sort: "updated",
          per_page: 100,
          type: "owner",
        });

        const user = await prisma.user.findUnique({
          where: { githubId: session.user.githubId },
          include: { repos: true },
        });

        const connectedRepoNames = new Set(user?.repos.map((r) => r.fullName) || []);

        const repoList = repos.map((repo) => ({
          fullName: repo.full_name,
          description: repo.description,
          private: repo.private,
          connected: connectedRepoNames.has(repo.full_name),
        }));

        return { repos: repoList };
      } catch (error) {
        console.error("Error prefetching repos:", error);
        return { repos: [] };
      }
    },
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ReposView />
    </HydrationBoundary>
  );
}
