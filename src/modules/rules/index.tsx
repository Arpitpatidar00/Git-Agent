"use client";

import { useState, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  useRules,
  useToggleRule,
  useDeleteRule,
} from "@/lib/hooks/useRules";
import { useDashboardRepos } from "@/lib/hooks/useDashboard";
import { Rule, Repo } from "@/types";
import { RuleCard } from "./components/RuleCard";
import { RuleForm } from "./components/RuleForm";

import { useAlert } from "@/lib/providers/alert-provider";

import { GlassButton, GlassSelect, GlassCard } from "@/components/glass";

export function RulesView() {
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | undefined>(undefined);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const rulesParentRef = useRef<HTMLDivElement>(null);
  const { showAlert, showConfirm } = useAlert();

  const { data: reposData } = useDashboardRepos();

  const repos = reposData?.repos || [];
  const activeRepoId = selectedRepo || repos[0]?.id || "";

  const { data: rulesData, isLoading } = useRules(activeRepoId);
  const toggleMutation = useToggleRule(activeRepoId);
  const deleteMutation = useDeleteRule(activeRepoId);

  const rules = rulesData?.rules || [];

  const rulesVirtualizer = useVirtualizer({
    count: rules.length,
    getScrollElement: () => rulesParentRef.current,
    estimateSize: () => 110,
    overscan: 5,
  });

  const virtualRules = rulesVirtualizer.getVirtualItems();

  async function handleToggle(id: string, enabled: boolean) {
    try {
      await toggleMutation.mutateAsync({ id, enabled });
    } catch (err: any) {
      showAlert(err.message || "Failed to toggle rule", "Error");
    }
  }

  async function handleDelete(id: string) {
    const confirmed = await showConfirm("Delete this rule? This cannot be undone.", "Delete Rule");
    if (!confirmed) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err: any) {
      showAlert(err.message || "Failed to delete rule", "Error");
    }
  }

  return (
    <div className="p-8 animate-fade-in space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/75 bg-clip-text text-transparent">
            Automation Rules
          </h1>
          <p className="text-sm text-muted mt-1 font-medium">
            Define rules to automatically respond to GitHub events
          </p>
        </div>
        <GlassButton
          variant="primary"
          onClick={() => {
            setEditingRule(undefined);
            setShowForm(true);
          }}
          disabled={repos.length === 0}
          className="gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Rule
        </GlassButton>
      </div>

      {/* Repo selector */}
      {repos.length > 1 && (
        <div className="max-w-xs">
          <GlassSelect
            value={activeRepoId}
            onChange={(e) => setSelectedRepo(e.target.value)}
          >
            {repos.map((r) => (
              <option key={r.id} value={r.id} className="bg-zinc-950 text-foreground">
                {r.fullName}
              </option>
            ))}
          </GlassSelect>
        </div>
      )}

      {repos.length === 0 ? (
        <GlassCard className="p-16 text-center">
          <p className="font-semibold text-muted text-base">No repos connected</p>
          <p className="text-xs text-muted/65 mt-1">
            Connect a repository first from the Repos page
          </p>
        </GlassCard>
      ) : isLoading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-white/5 rounded-xl" />
          ))}
        </div>
      ) : rules.length === 0 ? (
        <GlassCard className="p-16 text-center">
          <p className="font-semibold text-muted text-base">No rules yet</p>
          <p className="text-xs text-muted/65 mt-1">
            Create a rule to automate actions on GitHub events
          </p>
        </GlassCard>
      ) : (
        <div
          ref={rulesParentRef}
          className="overflow-y-auto max-h-[500px] relative border border-[var(--glass-border)] rounded-2xl bg-zinc-900/20 backdrop-blur-sm p-2 shadow-inner"
        >
          <div
            style={{
              height: `${rulesVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualRules.map((virtualRow) => {
              const rule = rules[virtualRow.index];
              if (!rule) return null;
              return (
                <div
                  key={rule.id}
                  data-index={virtualRow.index}
                  ref={rulesVirtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                    padding: "8px",
                  }}
                >
                  <RuleCard
                    rule={rule}
                    onToggle={handleToggle}
                    onEdit={(r) => {
                      setEditingRule(r);
                      setShowForm(true);
                    }}
                    onDelete={handleDelete}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rule creation modal */}
      {showForm && (
        <RuleForm
          repos={repos}
          selectedRepoId={activeRepoId}
          ruleToEdit={editingRule}
          onClose={() => {
            setShowForm(false);
            setEditingRule(undefined);
          }}
        />
      )}
    </div>
  );
}
