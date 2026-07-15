"use client";

import { useState } from "react";
import {
  EVENT_TYPES,
  MATCH_FIELDS,
  MATCH_OPERATORS,
  ACTION_TYPES,
} from "@/constants";
import { useCreateRule, useUpdateRule } from "@/lib/hooks/useRules";
import { Rule, Repo } from "@/types";
import {
  EVENT_TYPE_LABELS,
  MATCH_FIELD_LABELS,
  MATCH_OPERATOR_LABELS,
  ACTION_TYPE_LABELS,
} from "./RuleCard";

import { useAlert } from "@/lib/providers/alert-provider";
import { GlassModal, GlassSelect, GlassInput, GlassButton } from "@/components/glass";

interface RuleFormProps {
  repos: Repo[];
  onClose: () => void;
  selectedRepoId: string;
  ruleToEdit?: Rule;
}

export function RuleForm({ repos, onClose, selectedRepoId, ruleToEdit }: RuleFormProps) {
  const createMutation = useCreateRule();
  const updateMutation = useUpdateRule(selectedRepoId);
  const { showAlert } = useAlert();

  const [form, setForm] = useState<{
    repoId: string;
    eventType: string;
    matchField: string;
    matchOperator: string;
    matchValue: string;
    actionType: string;
    actionValue: string;
  }>({
    repoId: ruleToEdit?.repoId || selectedRepoId || repos[0]?.id || "",
    eventType: ruleToEdit?.eventType || EVENT_TYPES.ISSUES,
    matchField: ruleToEdit?.matchField || MATCH_FIELDS.TITLE,
    matchOperator: ruleToEdit?.matchOperator || MATCH_OPERATORS.CONTAINS,
    matchValue: ruleToEdit?.matchValue || "",
    actionType: ruleToEdit?.actionType || ACTION_TYPES.ADD_LABEL,
    actionValue: ruleToEdit?.actionValue || "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (ruleToEdit) {
        await updateMutation.mutateAsync({ id: ruleToEdit.id, ...form });
      } else {
        await createMutation.mutateAsync(form);
      }
      onClose();
    } catch (err: any) {
      showAlert(err.message || `Failed to ${ruleToEdit ? "update" : "create"} rule`, "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <GlassModal
      isOpen={true}
      onClose={onClose}
      title={ruleToEdit ? "Edit Automation Rule" : "New Automation Rule"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <GlassSelect
            label="Repository"
            value={form.repoId}
            onChange={(e) => setForm({ ...form, repoId: e.target.value })}
            disabled={!!ruleToEdit}
          >
            {repos.map((r) => (
              <option key={r.id} value={r.id} className="bg-zinc-950">
                {r.fullName}
              </option>
            ))}
          </GlassSelect>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <GlassSelect
              label="Event Type"
              value={form.eventType}
              onChange={(e) => setForm({ ...form, eventType: e.target.value })}
            >
              {Object.values(EVENT_TYPES).map((t) => (
                <option key={t} value={t} className="bg-zinc-950">
                  {EVENT_TYPE_LABELS[t] || t}
                </option>
              ))}
            </GlassSelect>
          </div>
          <div>
            <GlassSelect
              label="Match Field"
              value={form.matchField}
              onChange={(e) => setForm({ ...form, matchField: e.target.value })}
            >
              {Object.values(MATCH_FIELDS).map((f) => (
                <option key={f} value={f} className="bg-zinc-950">
                  {MATCH_FIELD_LABELS[f] || f}
                </option>
              ))}
            </GlassSelect>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <GlassSelect
              label="Operator"
              value={form.matchOperator}
              onChange={(e) => setForm({ ...form, matchOperator: e.target.value })}
            >
              {Object.values(MATCH_OPERATORS).map((o) => (
                <option key={o} value={o} className="bg-zinc-950">
                  {MATCH_OPERATOR_LABELS[o] || o}
                </option>
              ))}
            </GlassSelect>
          </div>
          <div>
            <GlassInput
              label="Match Value"
              type="text"
              value={form.matchValue}
              onChange={(e) => setForm({ ...form, matchValue: e.target.value })}
              placeholder='e.g. "bug", "feature"'
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <GlassSelect
              label="Action"
              value={form.actionType}
              onChange={(e) => setForm({ ...form, actionType: e.target.value })}
            >
              {Object.values(ACTION_TYPES).map((a) => (
                <option key={a} value={a} className="bg-zinc-950">
                  {ACTION_TYPE_LABELS[a] || a}
                </option>
              ))}
            </GlassSelect>
          </div>
          <div>
            <GlassInput
              label="Action Value"
              type="text"
              value={form.actionValue}
              onChange={(e) => setForm({ ...form, actionValue: e.target.value })}
              placeholder="Label name, comment text, etc."
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--glass-border)]">
          <GlassButton type="button" onClick={onClose} variant="secondary">
            Cancel
          </GlassButton>
          <GlassButton type="submit" variant="primary" disabled={saving}>
            {saving ? (ruleToEdit ? "Saving…" : "Creating…") : (ruleToEdit ? "Save Rule" : "Create Rule")}
          </GlassButton>
        </div>
      </form>
    </GlassModal>
  );
}
