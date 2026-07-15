"use client";

import { Rule } from "@/types";

export const EVENT_TYPE_LABELS: Record<string, string> = {
  issues: "Issues",
  pull_request: "Pull Requests",
  push: "Branch Push",
  issue_comment: "Issue Comments",
};

export const MATCH_FIELD_LABELS: Record<string, string> = {
  title: "Title",
  body: "Description",
  author: "Author Name",
  label: "Label",
};

export const MATCH_OPERATOR_LABELS: Record<string, string> = {
  contains: "Contains",
  equals: "Equals",
  starts_with: "Starts With",
  ends_with: "Ends With",
  regex: "Matches Regex",
};

export const ACTION_TYPE_LABELS: Record<string, string> = {
  add_label: "Add GitHub Label",
  comment: "Post GitHub Comment",
  slack_notify: "Send Slack Alert",
};

import { GlassCard } from "@/components/glass";

interface RuleCardProps {
  rule: Rule;
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (rule: Rule) => void;
  onDelete: (id: string) => void;
}

export function RuleCard({ rule, onToggle, onEdit, onDelete }: RuleCardProps) {
  return (
    <GlassCard
      className={`p-5 hover:scale-[1.005] ${rule.enabled ? "" : "opacity-50"
        }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3 min-w-0">
          <div className="flex items-center gap-2 flex-wrap text-xs font-semibold">
            <span className="px-2.5 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary">
              {EVENT_TYPE_LABELS[rule.eventType] || rule.eventType}
            </span>
            <span className="text-muted/50 text-[11px] lowercase italic">when</span>
            <span className="px-2.5 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/20 text-amber-400">
              {MATCH_FIELD_LABELS[rule.matchField] || rule.matchField}
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-foreground">
              {MATCH_OPERATOR_LABELS[rule.matchOperator] || rule.matchOperator}
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-white/10 border border-white/20 text-foreground font-mono">
              &quot;{rule.matchValue}&quot;
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <span className="text-muted/60">→</span>
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-400/10 border border-emerald-400/20 text-emerald-400">
              {ACTION_TYPE_LABELS[rule.actionType] || rule.actionType}
            </span>
            <span className="text-muted/80 font-medium truncate max-w-[200px]">{rule.actionValue}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onToggle(rule.id, !rule.enabled)}
            className={`relative w-10 h-5.5 rounded-full transition-colors cursor-pointer border border-white/5 ${rule.enabled ? "bg-primary shadow-[0_0_8px_rgba(99,102,241,0.4)]" : "bg-white/10"
              }`}
          >
            <span
              className={`absolute top-[2px] left-[2px] w-4 h-4 rounded-full bg-white transition-transform ${rule.enabled ? "translate-x-[18px]" : ""
                }`}
            />
          </button>
          <button
            onClick={() => onEdit(rule)}
            className="p-2 rounded-xl text-muted/60 hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/15 transition-all cursor-pointer"
            title="Edit Rule"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(rule.id)}
            className="p-2 rounded-xl text-muted/60 hover:text-red-400 hover:bg-red-400/10 border border-transparent hover:border-red-500/15 transition-all cursor-pointer"
            title="Delete Rule"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
