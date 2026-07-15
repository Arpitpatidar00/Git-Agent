import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAuthSession } from "@/lib/auth/session";
import {
  EVENT_TYPES,
  MATCH_FIELDS,
  MATCH_OPERATORS,
  ACTION_TYPES,
} from "@/constants";

// ─── Validation helpers ────────────────────────────────────────
const VALID_EVENT_TYPES: Set<string> = new Set(Object.values(EVENT_TYPES));
const VALID_MATCH_FIELDS: Set<string> = new Set(Object.values(MATCH_FIELDS));
const VALID_MATCH_OPERATORS: Set<string> = new Set(Object.values(MATCH_OPERATORS));
const VALID_ACTION_TYPES: Set<string> = new Set(Object.values(ACTION_TYPES));
const MAX_STRING_LENGTH = 1000;

function validateRuleFields(body: Record<string, unknown>): string | null {
  const { eventType, matchField, matchOperator, matchValue, actionType, actionValue } = body;

  if (!VALID_EVENT_TYPES.has(eventType as string)) {
    return `Invalid eventType. Must be one of: ${[...VALID_EVENT_TYPES].join(", ")}`;
  }
  if (!VALID_MATCH_FIELDS.has(matchField as string)) {
    return `Invalid matchField. Must be one of: ${[...VALID_MATCH_FIELDS].join(", ")}`;
  }
  if (!VALID_MATCH_OPERATORS.has(matchOperator as string)) {
    return `Invalid matchOperator. Must be one of: ${[...VALID_MATCH_OPERATORS].join(", ")}`;
  }
  if (!VALID_ACTION_TYPES.has(actionType as string)) {
    return `Invalid actionType. Must be one of: ${[...VALID_ACTION_TYPES].join(", ")}`;
  }
  if (typeof matchValue !== "string" || matchValue.length === 0 || matchValue.length > MAX_STRING_LENGTH) {
    return `matchValue must be a non-empty string (max ${MAX_STRING_LENGTH} chars)`;
  }
  if (typeof actionValue !== "string" || actionValue.length === 0 || actionValue.length > MAX_STRING_LENGTH) {
    return `actionValue must be a non-empty string (max ${MAX_STRING_LENGTH} chars)`;
  }
  return null;
}

// ─── Allowed fields for PUT updates (Fix 3: prevent mass-assignment) ───
const ALLOWED_UPDATE_FIELDS = new Set([
  "eventType",
  "matchField",
  "matchOperator",
  "matchValue",
  "actionType",
  "actionValue",
  "enabled",
]);

function sanitizeUpdates(body: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const key of Object.keys(body)) {
    if (ALLOWED_UPDATE_FIELDS.has(key)) {
      sanitized[key] = body[key];
    }
  }
  return sanitized;
}

// ────────────────────────────────────────────────────────────────

/**
 * GET — List rules for a repo.
 * Query params: repoId (required)
 */
export async function GET(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const repoId = searchParams.get("repoId");

  if (!repoId) {
    return NextResponse.json(
      { error: "repoId is required" },
      { status: 400 }
    );
  }

  // Verify the repo belongs to this user
  const user = await prisma.user.findUnique({
    where: { githubId: session.user.githubId },
  });

  const repo = await prisma.repo.findFirst({
    where: { id: repoId, userId: user?.id },
  });

  if (!repo) {
    return NextResponse.json({ error: "Repo not found" }, { status: 404 });
  }

  const rules = await prisma.rule.findMany({
    where: { repoId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ rules });
}

/**
 * POST — Create a new rule for a repo.
 */
export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    repoId,
    eventType,
    matchField,
    matchOperator,
    matchValue,
    actionType,
    actionValue,
  } = body;

  // Validate required fields
  if (
    !repoId ||
    !eventType ||
    !matchField ||
    !matchOperator ||
    !matchValue ||
    !actionType ||
    !actionValue
  ) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  // Fix 4: Validate field values against allowed constants
  const validationError = validateRuleFields(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  // Verify repo ownership
  const user = await prisma.user.findUnique({
    where: { githubId: session.user.githubId },
  });

  const repo = await prisma.repo.findFirst({
    where: { id: repoId, userId: user?.id },
  });

  if (!repo) {
    return NextResponse.json({ error: "Repo not found" }, { status: 404 });
  }

  const rule = await prisma.rule.create({
    data: {
      repoId,
      eventType,
      matchField,
      matchOperator,
      matchValue,
      actionType,
      actionValue,
    },
  });

  return NextResponse.json({ rule }, { status: 201 });
}

/**
 * PUT — Update a rule.
 */
export async function PUT(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json(
      { error: "Rule id is required" },
      { status: 400 }
    );
  }

  // Fix 3: Whitelist allowed fields — prevents mass-assignment (e.g. changing repoId)
  const updates = sanitizeUpdates(body);

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  // Fix 4: Validate any enum fields that are being updated
  const fieldsToValidate = { ...updates } as Record<string, unknown>;
  // Fill in existing values for fields not being updated so validation doesn't fail
  const ENUM_FIELDS = ["eventType", "matchField", "matchOperator", "actionType"];
  for (const field of ENUM_FIELDS) {
    if (!(field in fieldsToValidate)) {
      // We'll validate only the fields being updated; skip missing ones
      fieldsToValidate[field] = undefined;
    }
  }
  // Only validate the fields that are actually present in the update
  for (const key of Object.keys(updates)) {
    if (key === "eventType" && !VALID_EVENT_TYPES.has(updates[key] as string)) {
      return NextResponse.json({ error: `Invalid eventType` }, { status: 400 });
    }
    if (key === "matchField" && !VALID_MATCH_FIELDS.has(updates[key] as string)) {
      return NextResponse.json({ error: `Invalid matchField` }, { status: 400 });
    }
    if (key === "matchOperator" && !VALID_MATCH_OPERATORS.has(updates[key] as string)) {
      return NextResponse.json({ error: `Invalid matchOperator` }, { status: 400 });
    }
    if (key === "actionType" && !VALID_ACTION_TYPES.has(updates[key] as string)) {
      return NextResponse.json({ error: `Invalid actionType` }, { status: 400 });
    }
    if (key === "enabled" && typeof updates[key] !== "boolean") {
      return NextResponse.json({ error: `enabled must be a boolean` }, { status: 400 });
    }
    if ((key === "matchValue" || key === "actionValue") &&
        (typeof updates[key] !== "string" || (updates[key] as string).length === 0 || (updates[key] as string).length > MAX_STRING_LENGTH)) {
      return NextResponse.json({ error: `${key} must be a non-empty string (max ${MAX_STRING_LENGTH} chars)` }, { status: 400 });
    }
  }

  // Verify ownership through the rule → repo → user chain
  const user = await prisma.user.findUnique({
    where: { githubId: session.user.githubId },
  });

  const existingRule = await prisma.rule.findFirst({
    where: { id },
    include: { repo: true },
  });

  if (!existingRule || existingRule.repo.userId !== user?.id) {
    return NextResponse.json({ error: "Rule not found" }, { status: 404 });
  }

  const rule = await prisma.rule.update({
    where: { id },
    data: updates,
  });

  return NextResponse.json({ rule });
}

/**
 * DELETE — Delete a rule.
 */
export async function DELETE(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json(
      { error: "Rule id is required" },
      { status: 400 }
    );
  }

  // Verify ownership
  const user = await prisma.user.findUnique({
    where: { githubId: session.user.githubId },
  });

  const existingRule = await prisma.rule.findFirst({
    where: { id },
    include: { repo: true },
  });

  if (!existingRule || existingRule.repo.userId !== user?.id) {
    return NextResponse.json({ error: "Rule not found" }, { status: 404 });
  }

  await prisma.rule.delete({ where: { id } });

  return NextResponse.json({ message: "Rule deleted" });
}
