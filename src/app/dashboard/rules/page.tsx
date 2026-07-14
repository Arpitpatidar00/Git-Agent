"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import {
  EVENT_TYPES,
  MATCH_FIELDS,
  MATCH_OPERATORS,
  ACTION_TYPES,
} from "@/lib/constants";

interface Rule {
  id: string;
  repoId: string;
  eventType: string;
  matchField: string;
  matchOperator: string;
  matchValue: string;
  actionType: string;
  actionValue: string;
  enabled: boolean;
  createdAt: string;
}

interface Repo {
  id: string;
  fullName: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function RuleForm({
  repos,
  onClose,
  selectedRepoId,
}: {
  repos: Repo[];
  onClose: () => void;
  selectedRepoId: string;
}) {
  const [form, setForm] = useState<{
    repoId: string;
    eventType: string;
    matchField: string;
    matchOperator: string;
    matchValue: string;
    actionType: string;
    actionValue: string;
  }>({
    repoId: selectedRepoId || repos[0]?.id || "",
    eventType: EVENT_TYPES.ISSUES,
    matchField: MATCH_FIELDS.TITLE,
    matchOperator: MATCH_OPERATORS.CONTAINS,
    matchValue: "",
    actionType: ACTION_TYPES.ADD_LABEL,
    actionValue: "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to create rule");
        return;
      }
      mutate(`/api/rules?repoId=${form.repoId}`);
      onClose();
    } catch {
      alert("Failed to create rule");
    } finally {
      setSaving(false);
    }
  }

  const selectClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow";
  const inputClass = selectClass;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 glass">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg mx-4 p-6 rounded-2xl bg-surface border border-border shadow-2xl animate-fade-in space-y-4"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold">New Automation Rule</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-card-hover transition-colors text-muted cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted mb-1">Repository</label>
          <select
            className={selectClass}
            value={form.repoId}
            onChange={(e) => setForm({ ...form, repoId: e.target.value })}
          >
            {repos.map((r) => (
              <option key={r.id} value={r.id}>
                {r.fullName}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Event Type</label>
            <select
              className={selectClass}
              value={form.eventType}
              onChange={(e) => setForm({ ...form, eventType: e.target.value })}
            >
              {Object.values(EVENT_TYPES).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Match Field</label>
            <select
              className={selectClass}
              value={form.matchField}
              onChange={(e) => setForm({ ...form, matchField: e.target.value })}
            >
              {Object.values(MATCH_FIELDS).map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Operator</label>
            <select
              className={selectClass}
              value={form.matchOperator}
              onChange={(e) => setForm({ ...form, matchOperator: e.target.value })}
            >
              {Object.values(MATCH_OPERATORS).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Match Value</label>
            <input
              type="text"
              className={inputClass}
              value={form.matchValue}
              onChange={(e) => setForm({ ...form, matchValue: e.target.value })}
              placeholder='e.g. "bug", "feature"'
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Action</label>
            <select
              className={selectClass}
              value={form.actionType}
              onChange={(e) => setForm({ ...form, actionType: e.target.value })}
            >
              {Object.values(ACTION_TYPES).map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Action Value</label>
            <input
              type="text"
              className={inputClass}
              value={form.actionValue}
              onChange={(e) => setForm({ ...form, actionValue: e.target.value })}
              placeholder="Label name, comment text, etc."
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-muted hover:bg-card-hover transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Creating…" : "Create Rule"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function RulesPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<string>("");

  // Get repos for the dropdown
  const { data: reposData } = useSWR<{ repos: { id: string; fullName: string }[] }>(
    "/api/dashboard/events",
    fetcher
  );

  const repos = reposData?.repos || [];
  const activeRepoId = selectedRepo || repos[0]?.id || "";

  const { data: rulesData, isLoading } = useSWR<{ rules: Rule[] }>(
    activeRepoId ? `/api/rules?repoId=${activeRepoId}` : null,
    fetcher
  );

  const rules = rulesData?.rules || [];

  async function toggleRule(id: string, enabled: boolean) {
    await fetch("/api/rules", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, enabled: !enabled }),
    });
    mutate(`/api/rules?repoId=${activeRepoId}`);
  }

  async function deleteRule(id: string) {
    if (!confirm("Delete this rule? This cannot be undone.")) return;
    await fetch("/api/rules", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    mutate(`/api/rules?repoId=${activeRepoId}`);
  }

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Automation Rules</h1>
          <p className="text-sm text-muted mt-1">
            Define rules to automatically respond to GitHub events
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          disabled={repos.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Rule
        </button>
      </div>

      {/* Repo selector */}
      {repos.length > 1 && (
        <div className="mb-6">
          <select
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={activeRepoId}
            onChange={(e) => setSelectedRepo(e.target.value)}
          >
            {repos.map((r) => (
              <option key={r.id} value={r.id}>
                {r.fullName}
              </option>
            ))}
          </select>
        </div>
      )}

      {repos.length === 0 ? (
        <div className="p-12 rounded-xl border border-dashed border-border text-center">
          <p className="font-medium text-muted">No repos connected</p>
          <p className="text-xs text-muted mt-1">
            Connect a repository first from the Repos page
          </p>
        </div>
      ) : isLoading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-surface rounded-xl" />
          ))}
        </div>
      ) : rules.length === 0 ? (
        <div className="p-12 rounded-xl border border-dashed border-border text-center">
          <p className="font-medium text-muted">No rules yet</p>
          <p className="text-xs text-muted mt-1">
            Create a rule to automate actions on GitHub events
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`p-4 rounded-xl border transition-all ${
                rule.enabled
                  ? "bg-surface border-border hover:border-primary/20"
                  : "bg-surface/50 border-border/50 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary/10 text-primary">
                      {rule.eventType}
                    </span>
                    <span className="text-xs text-muted">when</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-400/10 text-amber-400">
                      {rule.matchField}
                    </span>
                    <span className="text-xs text-muted">{rule.matchOperator}</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface border border-border">
                      &quot;{rule.matchValue}&quot;
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted">→</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-400/10 text-emerald-400">
                      {rule.actionType}
                    </span>
                    <span className="text-xs text-muted">{rule.actionValue}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleRule(rule.id, rule.enabled)}
                    className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
                      rule.enabled ? "bg-primary" : "bg-border"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        rule.enabled ? "translate-x-5" : ""
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rule creation modal */}
      {showForm && (
        <RuleForm
          repos={repos}
          selectedRepoId={activeRepoId}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
