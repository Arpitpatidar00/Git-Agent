import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { DashboardData } from "@/types";

export const DASHBOARD_QUERY_KEYS = {
  dashboard: ["dashboardEvents"] as const,
  repos: ["rulesDashboardData"] as const,
};

export function useDashboardEvents() {
  return useInfiniteQuery<DashboardData>({
    queryKey: DASHBOARD_QUERY_KEYS.dashboard,
    queryFn: ({ pageParam = 1 }) =>
      api.get<DashboardData>(`/api/dashboard/events?page=${pageParam}&limit=20`),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    refetchInterval: 5000,
  });
}

export function useDashboardRepos() {
  return useQuery<DashboardData>({
    queryKey: DASHBOARD_QUERY_KEYS.repos,
    queryFn: () => api.get<DashboardData>("/api/dashboard/events"),
  });
}
