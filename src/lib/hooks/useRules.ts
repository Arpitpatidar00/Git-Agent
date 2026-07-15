import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Rule } from "@/types";

export const RULES_QUERY_KEYS = {
  rules: (repoId: string) => ["rules", repoId] as const,
};

export function useRules(repoId: string) {
  return useQuery<{ rules: Rule[] }>({
    queryKey: RULES_QUERY_KEYS.rules(repoId),
    queryFn: () => api.get<{ rules: Rule[] }>(`/api/rules?repoId=${repoId}`),
    enabled: !!repoId,
  });
}

export function useCreateRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (form: Omit<Rule, "id" | "enabled" | "createdAt">) =>
      api.post<{ rule: Rule }>("/api/rules", form),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["dashboardEvents"] });
      queryClient.invalidateQueries({ queryKey: RULES_QUERY_KEYS.rules(data.rule.repoId) });
    },
  });
}

export function useUpdateRule(repoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { id: string } & Partial<Rule>) =>
      api.put<{ rule: Rule }>("/api/rules", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RULES_QUERY_KEYS.rules(repoId) });
    },
  });
}

export function useToggleRule(repoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      api.put<{ rule: Rule }>("/api/rules", { id, enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RULES_QUERY_KEYS.rules(repoId) });
    },
  });
}

export function useDeleteRule(repoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ message: string }>("/api/rules", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RULES_QUERY_KEYS.rules(repoId) });
    },
  });
}
