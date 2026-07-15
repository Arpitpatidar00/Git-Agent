# Git-Agent (GitHub Automation Bot)

An event-driven GitHub automation bot that processes repository webhooks, executes user-defined rules, sends Slack notifications, and performs automated write-back actions (such as adding labels and posting comments) on GitHub issues and pull requests, all monitored from a premium Next.js dashboard.

## What it does
Git-Agent acts as an automated assistant for your GitHub repositories. When a connected repository triggers an event (e.g., an issue or pull request is opened, closed, or labeled), the bot receives a webhook payload, verifies its authenticity using HMAC signatures, and stores it in a database-backed job queue. A background worker evaluates the event against user-configured rules (matching on fields like title, body, author, or labels) and executes corresponding actions: labeling issues, posting comments, or sending rich notifications to Slack.

## Live URL
[https://git-agent-delta.vercel.app/](https://git-agent-delta.vercel.app/)

## How to run locally

Follow these steps to run Git-Agent in your local development environment:

### 1. Clone the Repository
```bash
git clone https://github.com/Arpitpatidar00/Git-Agent.git
cd Git-Agent
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root of the project:
```bash
cp .env.example .env
```
Open `.env` and fill in the required environment variables (see the [Environment variables](#environment-variables) section below for details).

### 4. Initialize the Database
Make sure your PostgreSQL database (e.g., Neon or Supabase) is running and accessible. Then, generate the Prisma client and push the schema to your database:
```bash
npx prisma generate
npx prisma db push
```

### 5. Run the Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application dashboard.

## Environment variables

The application relies on the following environment variables. Ensure they are configured in your `.env` file for local development and in your hosting provider's dashboard for production deployments.

| Variable Name | Description | Where to Get It / Notes |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string with transaction pooling. | Obtained from your database provider (e.g., Neon or Supabase connection pooler URL). |
| `DIRECT_URL` | PostgreSQL direct connection string. | Used by Prisma for migrations and direct database schema updates, bypassing the connection pooler. |
| `NEXTAUTH_URL` | Canonical URL of the application. | Use `http://localhost:3000` for local dev; use your Vercel deployment URL in production. |
| `NEXTAUTH_SECRET` | Secret key used to sign and encrypt NextAuth session cookies. | Generate using `openssl rand -base64 32` in your terminal. |
| `GITHUB_CLIENT_ID` | OAuth Client ID for your GitHub Developer Application. | Register a new OAuth Application under GitHub Developer Settings. |
| `GITHUB_CLIENT_SECRET` | OAuth Client Secret for your GitHub Developer Application. | Generated within your GitHub Developer Application settings page. |
| `GITHUB_WEBHOOK_SECRET`| Shared secret used to verify incoming GitHub webhook signatures. | Generate using `openssl rand -hex 32` and configure both in your `.env` and in GitHub webhook settings. |
| `SLACK_WEBHOOK_URL` | Webhook URL to send Slack messages to. | Set up an "Incoming Webhook" integration in your Slack workspace. |
| `CRON_SECRET` | Secret token to authorize worker executions on the `/api/jobs/run` endpoint. | Generate using `openssl rand -hex 32` and pass as a Bearer token in cron job headers. |
| `GEMINI_API_KEY` | API Key for Google Gemini (stretch goal). | Left empty as Gemini triage is not currently active in the core logic. |

## Architecture

Git-Agent uses a modern serverless architecture built on Next.js 16 (App Router), Prisma ORM, and PostgreSQL.

### Data Flow:
1. **Sign In**: Users authenticate securely via **NextAuth.js** using the GitHub OAuth provider. Their OAuth access token is stored securely in the `User` table to allow background actions.
2. **Connect Repo**: From the dashboard, the user selects a repository they own. The system stores the repository details in the database and programmatically registers a webhook on GitHub pointing to the application's webhook endpoint.
3. **Webhook Received**: When an event occurs on GitHub, a POST request is sent to `/api/webhooks/github`. The handler performs an HMAC signature check using `crypto.timingSafeEqual` to reject forged requests.
4. **Enqueued**: The verified webhook event is written to the `Event` database table. A unique constraint on the `githubDeliveryId` acts as an idempotency guard, silently ignoring duplicates. The handler returns a `200 OK` status immediately.
5. **Processed**: The background worker (`/api/jobs/run` triggered by Vercel Cron or asynchronously triggered via Next.js `after()` API) fetches unprocessed events, evaluates them against active database rules, and executes matching actions.
6. **Written Back & Notified**: The worker performs write-back calls to GitHub (adding labels or posting comments via the Octokit library) and fires rich alerts to the configured Slack incoming webhook.
7. **Shown on Dashboard**: Successes, failures, retries, and action logs are updated on the dashboard in real-time, backed by React SWR polling.

## Deployment

Git-Agent is deployed to **Vercel** with a PostgreSQL database hosted on **Supabase** (utilizing connection pooling).

### Vercel Deployment Process:
1. Push your code to your GitHub repository.
2. Connect your repository to Vercel.
3. Define all required environment variables in the Vercel project settings (specifically ensuring `DIRECT_URL` is configured alongside `DATABASE_URL` to handle Supabase connection pooling correctly).
4. Vercel automatically builds and deploys the Next.js application.
5. The daily cron job configuration in `vercel.json` is automatically registered by Vercel to ping `/api/jobs/run`.

## Testing it

To review and test Git-Agent:
1. Go to the live application at [https://git-agent-delta.vercel.app/](https://git-agent-delta.vercel.app/).
2. Log in using your GitHub account.
3. Navigate to the Repo management page and connect a repository you own.
4. Go to the Rules page and create an automation rule (e.g., *If issue title contains "bug", execute action "Add Label: bug"*).
5. Open an issue on your connected repository containing the keyword "bug".
6. Check the Event Dashboard to verify that the webhook event was received, enqueued, and processed successfully.
7. Observe that the "bug" label has been programmatically applied to the issue on GitHub.

## What's implemented vs stretch goals

Here is the status of the requirements defined in the assignment checklist:

- [x] **NextAuth GitHub OAuth Login** — Implemented
- [x] **Programmatic Webhook Registration** — Implemented (creates webhook on GitHub automatically upon repo connection)
- [x] **HMAC Signature Verification** — Implemented (validates payloads using timing-safe comparison)
- [x] **Idempotency Guard** — Implemented (uses unique constraint on `githubDeliveryId` to block duplicate deliveries)
- [x] **Rule Engine** — Implemented (evaluates matching rules on title, body, author, and labels)
- [x] **GitHub Write-back Actions** — Implemented (adds labels and posts comments using `@octokit/rest`)
- [x] **Slack Integration** — Implemented (sends rich messages via Incoming Webhooks)
- [x] **DB-Backed Job Queue** — Implemented (stores events in Postgres database with status state-machine)
- [x] **Retry Mechanism & DLQ** — Implemented (tries failing events up to 5 times before marking them as dead)
- [x] **Web Dashboard** — Implemented (displays events, statuses, logs, and stats with pagination and SWR polling)
- [ ] **AI Triage with Gemini (Stretch)** — Not done (infrastructure ready but not active in core workflow)
- [ ] **GitHub App Authentication (Stretch)** — Not done (uses GitHub OAuth tokens stored in DB)
- [ ] **Telegram Notification Channel (Stretch)** — Not done
