# AGENTS.md — Event-Driven GitHub Automation Bot

Context file for AI coding agents (Claude Code / Cursor). Read fully before writing code.
Follow phase order. Do not skip Immediate items to reach stretch goals.

---

## 1. Tech Stack (locked — do not substitute without asking)

| Layer         | Choice                                         | Why                                                             |
| ------------- | ---------------------------------------------- | --------------------------------------------------------------- |
| Framework     | Next.js 14 (App Router) + TypeScript           | single deploy target, API routes = webhook + auth in one repo   |
| Auth          | NextAuth.js (GitHub provider)                  | handles OAuth + session cookies, minimal glue code              |
| DB            | Postgres via Neon (free, no card)              | need relational + JSON column for raw payloads                  |
| ORM           | Prisma                                         | migrations + type-safe queries, fast to scaffold                |
| Queue/retry   | DB-backed job table (no Redis)                 | free tier, no extra infra; polling worker or cron               |
| Notifications | Slack Incoming Webhook                         | simplest auth model (just a URL secret)                         |
| Hosting       | Vercel                                         | free, public HTTPS URL instantly, works with Next.js API routes |
| GitHub API    | Octokit (`@octokit/rest`, `@octokit/webhooks`) | official, has built-in signature verification                   |
| AI (stretch)  | Gemini via `@google/generative-ai`             | free tier, no card                                              |

Vercel serverless functions have a request timeout — webhook handler must return fast (ack immediately, process async via job table, not inline blocking calls).

---

## 2. Three-Tier Structure (mirrors your usual component hierarchy pattern)

```
/app
  /api/auth/[...nextauth]/route.ts      # OAuth
  /api/webhooks/github/route.ts          # receives events — THIN, just verify+enqueue
  /api/repos/connect/route.ts            # link a repo to a user
  /api/rules/route.ts                    # CRUD for automation rules
  /dashboard/page.tsx                     # protected, server component
  /dashboard/rules/page.tsx
/lib
  /github/
    client.ts          # Octokit instance factory
    verify.ts           # HMAC signature check (Tier 1: pure, no I/O)
    actions.ts          # addLabel(), postComment() (Tier 2: I/O wrappers)
  /slack/
    notify.ts
  /ai/
    triage.ts            # Gemini call, stretch goal
  /rules/
    engine.ts             # evaluates event against stored rules (Tier 1: pure logic)
  /jobs/
    enqueue.ts
    worker.ts              # processes queued events, called by cron route
  /db/
    prisma.ts
  constants.ts             # event types, label names, retry limits — ALL magic strings live here
/prisma/schema.prisma
.env.example
AI_NOTES.md
README.md
```

Rule: webhook route does verification + enqueue only, nothing else. All actual side effects (GitHub write, Slack post) happen in the worker, never inline in the request handler. This is what makes retries and idempotency possible.

---

## 3. Data Model (Prisma schema — draft, adjust field names freely)

```prisma
model User {
  id            String   @id @default(cuid())
  githubId      String   @unique
  githubLogin   String
  repos         Repo[]
}

model Repo {
  id            String   @id @default(cuid())
  userId        String
  fullName      String   // "owner/repo"
  installationId String? // if using GitHub App auth (stretch)
  rules         Rule[]
  events        Event[]
  @@unique([userId, fullName])
}

model Rule {
  id            String   @id @default(cuid())
  repoId        String
  eventType     String   // "issues", "pull_request"
  matchField    String   // "title", "author", "label"
  matchOperator String   // "contains", "equals"
  matchValue    String
  actionType    String   // "add_label", "comment", "slack_notify"
  actionValue   String   // label name / comment template
  enabled       Boolean  @default(true)
}

model Event {
  id              String   @id @default(cuid())
  repoId          String
  githubDeliveryId String  @unique   // <-- idempotency key, from X-GitHub-Delivery header
  eventType       String
  action          String?             // "opened", "closed" etc
  payload         Json
  status          String   @default("received") // received | processing | done | failed
  attempts        Int      @default(0)
  lastError       String?
  createdAt       DateTime @default(now())
  actions         ActionLog[]
}

model ActionLog {
  id          String   @id @default(cuid())
  eventId     String
  type        String   // "github_label" | "github_comment" | "slack_message"
  status      String   // "success" | "failed"
  detail      String?
  createdAt   DateTime @default(now())
}
```

`githubDeliveryId` unique constraint is your dedupe guard — GitHub retries deliveries with the same ID, insert will fail/conflict, you catch that and treat as already-handled.

---

## 4. Build Order — Immediate / Short-term / Backlog

### Immediate (must work end-to-end before anything else)

1. Scaffold Next.js + Prisma + Neon connection, deploy empty app to Vercel first (get the public URL before writing webhook logic — you need it for the GitHub App/OAuth callback URLs anyway).
2. NextAuth GitHub OAuth login → protected `/dashboard` shell.
3. Repo connect flow: after login, let user pick a repo they own (GitHub API `GET /user/repos`), store in `Repo` table, and programmatically create the webhook on that repo via `POST /repos/{owner}/{repo}/hooks` pointing at your deployed `/api/webhooks/github` — pass a per-repo or global `WEBHOOK_SECRET`.
4. Webhook endpoint:
   - Verify `X-Hub-Signature-256` against `WEBHOOK_SECRET` using timing-safe compare (`crypto.timingSafeEqual`). Reject with 401 if mismatch — this is your anti-forgery requirement.
   - Read `X-GitHub-Delivery` header → this is the idempotency key.
   - Insert into `Event` table; on unique constraint violation, return 200 immediately without reprocessing (already-seen event).
   - Return 200 fast. Do not call GitHub/Slack inline here.
5. Worker: a route (`/api/jobs/run`) triggered by Vercel Cron (every 1 min, free tier allows this) that picks `status=received` events, marks `processing`, evaluates rules, performs actions, writes `ActionLog`, marks `done` or `failed` with `lastError` and increments `attempts`. Cap retries (e.g. 5) via `constants.ts`, after which mark `dead`.
6. Rule engine: pure function `evaluateRules(event, rules): Action[]` — no I/O, easy to unit test.
7. GitHub write-back: `addLabel()` and/or `postComment()` in `lib/github/actions.ts`, called from worker.
8. Slack notify: incoming webhook POST, called from worker.
9. Dashboard: list `Event` + joined `ActionLog`, newest first, poll or use SWR every few seconds for "live" feel — full websockets are overkill for the grading bar.
10. README.md + `.env.example` + AI_NOTES.md.

### Short-term (stretch, do after Immediate is fully solid)

11. Rule builder UI (`/dashboard/rules`) — form to create rules instead of DB seeding.
12. AI triage step: worker calls Gemini with issue/PR title+body, gets back a suggested label/priority/summary, stores on `ActionLog.detail`, shown in dashboard and included in Slack message. Guard with try/catch — AI failure must not fail the whole event.
13. Structured logging: wrap worker actions in a small logger that writes to `ActionLog` consistently (you already have this table — make sure failures are just as visible as successes in the UI, not just console.log).

### Backlog (only if time remains)

14. GitHub App auth (JWT + installation tokens) instead of OAuth app — needed for true multi-repo/org support and higher rate limits.
15. Multi-repo support in one dashboard view with a repo switcher.
16. Telegram as a second notification channel.

---

## 5. Non-negotiable Quality Bar — mapped to concrete implementation

| Requirement                                | Concrete mechanism                                                                                                                                                                                                        |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Not foolable by forged requests            | HMAC signature check on every webhook request, `timingSafeEqual`, reject unsigned/mismatched requests with 401 before touching DB                                                                                         |
| No duplicate processing on replay          | `githubDeliveryId` unique DB constraint, catch conflict, no-op                                                                                                                                                            |
| No silent event loss on downstream failure | Event always persisted before any external call; worker retries with `attempts`/`lastError`; failures visible in dashboard, not swallowed                                                                                 |
| No secret exposure                         | All secrets in Vercel env vars only; never in client components, never `console.log`'d, `.env.example` has empty placeholder values only; add `.env` to `.gitignore` explicitly and verify it's not in the commit history |

---

## 6. Environment Variables (put in `.env.example`, no real values)

```
DATABASE_URL=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_WEBHOOK_SECRET=
SLACK_WEBHOOK_URL=
GEMINI_API_KEY=          # only if AI stretch goal is done
CRON_SECRET=              # protects /api/jobs/run from being called by anyone but Vercel Cron
```

---

## 7. Agent Working Rules

- Do not hardcode event type strings, label names, or retry counts inline — everything goes in `lib/constants.ts`.
- Every new utility file should be drop-in ready: full file, correct imports, no partial snippets requiring manual assembly.
- When fixing a bug, give before/after patches, not a full-file rewrite, unless the file is new.
- Webhook route handler stays thin — verification and enqueue only. Any logic beyond that belongs in `/lib`.
- Ask before introducing a new external service or paid tier of anything.
