import { Rule } from "@prisma/client";
import { MATCH_OPERATORS, ACTION_TYPES, ACTION_LOG_TYPES } from "@/constants";

/**
 * Represents an action to be executed by the worker.
 */
export interface ActionToExecute {
  ruleId: string;
  actionType: string;
  actionValue: string;
  logType: string;
}

/**
 * Extracts a field value from the GitHub event payload for matching.
 */
function extractFieldValue(
  payload: Record<string, unknown>,
  eventType: string,
  matchField: string,
): string | null {
  // The primary object is issue or pull_request depending on event type
  const primary =
    (payload.issue as Record<string, unknown>) ||
    (payload.pull_request as Record<string, unknown>);

  if (!primary) return null;

  switch (matchField) {
    case "title":
      return (primary.title as string) || null;
    case "body":
      return (primary.body as string) || null;
    case "author": {
      const user = primary.user as Record<string, unknown> | undefined;
      return (user?.login as string) || null;
    }
    case "label": {
      // Check if the event itself is about a label action
      const label = payload.label as Record<string, unknown> | undefined;
      if (label?.name) return label.name as string;

      // Otherwise check all labels on the issue/PR
      const labels = primary.labels as Array<{ name: string }> | undefined;
      return labels?.map((l) => l.name).join(",") || null;
    }
    default:
      return null;
  }
}

/**
 * Checks if a field value matches a rule's criteria.
 */
function matchesRule(
  fieldValue: string,
  operator: string,
  matchValue: string,
): boolean {
  const normalizedField = fieldValue.toLowerCase();
  const normalizedMatch = matchValue.toLowerCase();

  switch (operator) {
    case MATCH_OPERATORS.CONTAINS:
      return normalizedField.includes(normalizedMatch);
    case MATCH_OPERATORS.EQUALS:
      // For comma-separated values (like labels), check each individually
      return normalizedField
        .split(",")
        .some((v) => v.trim() === normalizedMatch);
    case MATCH_OPERATORS.STARTS_WITH:
      return normalizedField.startsWith(normalizedMatch);
    case MATCH_OPERATORS.ENDS_WITH:
      return normalizedField.endsWith(normalizedMatch);
    case MATCH_OPERATORS.REGEX:
      try {
        const regex = new RegExp(matchValue, "i");
        return regex.test(fieldValue);
      } catch {
        return false;
      }
    default:
      return false;
  }
}

/**
 * Maps action type to action log type.
 */
function getLogType(actionType: string): string {
  switch (actionType) {
    case ACTION_TYPES.ADD_LABEL:
      return ACTION_LOG_TYPES.GITHUB_LABEL;
    case ACTION_TYPES.COMMENT:
      return ACTION_LOG_TYPES.GITHUB_COMMENT;
    case ACTION_TYPES.SLACK_NOTIFY:
      return ACTION_LOG_TYPES.SLACK_MESSAGE;
    default:
      return actionType;
  }
}

/**
 * Evaluates all rules against an event and returns the list of actions to execute.
 *
 * Pure function (Tier 1) — no I/O, easy to unit test.
 * Only evaluates enabled rules that match the event type.
 */
export function evaluateRules(
  eventType: string,
  payload: Record<string, unknown>,
  rules: Rule[],
): ActionToExecute[] {
  const actions: ActionToExecute[] = [];

  for (const rule of rules) {
    // Skip disabled rules or rules for different event types
    if (!rule.enabled || rule.eventType !== eventType) {
      continue;
    }

    const fieldValue = extractFieldValue(payload, eventType, rule.matchField);
    if (fieldValue === null) {
      continue;
    }

    if (matchesRule(fieldValue, rule.matchOperator, rule.matchValue)) {
      actions.push({
        ruleId: rule.id,
        actionType: rule.actionType,
        actionValue: rule.actionValue,
        logType: getLogType(rule.actionType),
      });
    }
  }

  return actions;
}
