import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { ReposData } from "@/types";

export const REPOS_QUERY_KEYS = {
  repos: ["repos"] as const,
};

export function useRepos() {
  return useQuery<ReposData>({
    queryKey: REPOS_QUERY_KEYS.repos,
    queryFn: () => api.get<ReposData>("/api/repos/connect"),
  });
}

export function useConnectRepo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fullName: string) =>
      api.post<{ message: string; warning?: string }>("/api/repos/connect", { fullName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REPOS_QUERY_KEYS.repos });
    },
  });
}

export function useDisconnectRepo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fullName: string) =>
      api.delete<{ message: string }>("/api/repos/connect", { fullName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REPOS_QUERY_KEYS.repos });
    },
  });
}
