# GitHub Automation Bot

Event-driven GitHub automation bot with webhook processing, rule-based actions, and real-time dashboard.

## Features

- **GitHub OAuth** — Sign in with your GitHub account
- **Repo Connection** — Link repos and automatically create webhooks
- **HMAC Verification** — All webhook payloads verified with timing-safe comparison
- **Idempotent Processing** — Duplicate deliveries handled via unique `githubDeliveryId`
- **Rule Engine** — Define rules to match events by title, author, labels
- **Automated Actions** — Auto-label issues, post comments, send Slack notifications
- **Job Queue** — DB-backed async processing with retries and dead-letter handling
- **Real-time Dashboard** — Live event monitoring with SWR polling

## Architecture

```
Webhook Event → Verify HMAC → Enqueue to DB → Return 200
                                    ↓
                        Cron Worker (every 1 min)
                                    ↓
                    Evaluate Rules → Execute Actions
                                    ↓
                    GitHub API / Slack → Log Results
```

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Auth | NextAuth.js (GitHub provider) |
| Database | Postgres via Neon |
| ORM | Prisma |
| Queue | DB-backed job table |
| Notifications | Slack Incoming Webhook |
| Hosting | Vercel |
| GitHub API | Octokit |

## Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd Agent
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in all values in `.env`:

- `DATABASE_URL` — Neon Postgres connection string
- `NEXTAUTH_URL` — Your deployment URL (e.g., `http://localhost:3000` for dev)
- `NEXTAUTH_SECRET` — Run `openssl rand -base64 32` to generate
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` — From GitHub OAuth App settings
- `GITHUB_WEBHOOK_SECRET` — Run `openssl rand -hex 32` to generate
- `SLACK_WEBHOOK_URL` — From Slack Incoming Webhook setup
- `CRON_SECRET` — Run `openssl rand -hex 32` to generate

### 3. Set up database

```bash
npx prisma generate
npx prisma db push
```

### 4. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000`

### 5. Deploy to Vercel

```bash
npx vercel
```

Set all environment variables in the Vercel dashboard. The cron job is configured in `vercel.json`.

## Project Structure

```
/app
  /api/auth/[...nextauth]/route.ts   — OAuth handler
  /api/webhooks/github/route.ts      — Webhook receiver (thin: verify+enqueue)
  /api/repos/connect/route.ts        — Repo CRUD + webhook creation
  /api/rules/route.ts                — Rule CRUD
  /api/jobs/run/route.ts             — Cron worker trigger
  /api/dashboard/events/route.ts     — Dashboard data API
  /dashboard/page.tsx                — Event dashboard
  /dashboard/repos/page.tsx          — Repo management
  /dashboard/rules/page.tsx          — Rule builder
/lib
  /github/client.ts                  — Octokit factory
  /github/verify.ts                  — HMAC signature verification
  /github/actions.ts                 — addLabel(), postComment()
  /slack/notify.ts                   — Slack webhook POST
  /rules/engine.ts                   — Pure rule evaluation
  /jobs/enqueue.ts                   — Event enqueue with idempotency
  /jobs/worker.ts                    — Async job processor
  /db/prisma.ts                      — Prisma singleton
  constants.ts                       — All magic strings
/prisma/schema.prisma                — Data model
```

## Security

- HMAC signature verification on every webhook request
- `crypto.timingSafeEqual` for constant-time comparison
- `githubDeliveryId` unique constraint prevents duplicate processing
- All secrets in environment variables only
- Cron endpoint protected by `CRON_SECRET`
- `.env` excluded from git

## License

MIT
