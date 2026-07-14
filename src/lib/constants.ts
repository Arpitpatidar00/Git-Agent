// ─── Event Types ───────────────────────────────────────────────
export const EVENT_TYPES = {
  ISSUES: "issues",
  PULL_REQUEST: "pull_request",
  PUSH: "push",
  ISSUE_COMMENT: "issue_comment",
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

// ─── Event Actions ─────────────────────────────────────────────
export const EVENT_ACTIONS = {
  OPENED: "opened",
  CLOSED: "closed",
  REOPENED: "reopened",
  EDITED: "edited",
  LABELED: "labeled",
  UNLABELED: "unlabeled",
  ASSIGNED: "assigned",
  SYNCHRONIZE: "synchronize",
  CREATED: "created",
} as const;

// ─── Match Fields ──────────────────────────────────────────────
export const MATCH_FIELDS = {
  TITLE: "title",
  BODY: "body",
  AUTHOR: "author",
  LABEL: "label",
} as const;

export type MatchField = (typeof MATCH_FIELDS)[keyof typeof MATCH_FIELDS];

// ─── Match Operators ───────────────────────────────────────────
export const MATCH_OPERATORS = {
  CONTAINS: "contains",
  EQUALS: "equals",
  STARTS_WITH: "starts_with",
  ENDS_WITH: "ends_with",
  REGEX: "regex",
} as const;

export type MatchOperator = (typeof MATCH_OPERATORS)[keyof typeof MATCH_OPERATORS];

// ─── Action Types ──────────────────────────────────────────────
export const ACTION_TYPES = {
  ADD_LABEL: "add_label",
  COMMENT: "comment",
  SLACK_NOTIFY: "slack_notify",
} as const;

export type ActionType = (typeof ACTION_TYPES)[keyof typeof ACTION_TYPES];

// ─── Job Statuses ──────────────────────────────────────────────
export const JOB_STATUS = {
  RECEIVED: "received",
  PROCESSING: "processing",
  DONE: "done",
  FAILED: "failed",
  DEAD: "dead",
} as const;

export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];

// ─── Action Log Types ──────────────────────────────────────────
export const ACTION_LOG_TYPES = {
  GITHUB_LABEL: "github_label",
  GITHUB_COMMENT: "github_comment",
  SLACK_MESSAGE: "slack_message",
} as const;

// ─── Action Log Statuses ───────────────────────────────────────
export const ACTION_LOG_STATUS = {
  SUCCESS: "success",
  FAILED: "failed",
} as const;

// ─── Retry Configuration ───────────────────────────────────────
export const MAX_RETRY_ATTEMPTS = 5;
export const JOB_BATCH_SIZE = 10;

// ─── Webhook Events to Subscribe ───────────────────────────────
export const WEBHOOK_EVENTS = ["issues", "pull_request", "issue_comment", "push"];

// ─── Default Labels ────────────────────────────────────────────
export const DEFAULT_LABELS = {
  BUG: "bug",
  FEATURE: "feature",
  ENHANCEMENT: "enhancement",
  QUESTION: "question",
  URGENT: "urgent",
  HELP_WANTED: "help wanted",
} as const;
