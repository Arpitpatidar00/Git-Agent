# AI Notes — Design Decisions & Trade-offs

## Architecture Decisions

### Webhook → Queue → Worker pattern
- **Why**: Vercel serverless functions have a request timeout. Webhook handler must return fast.
- **Trade-off**: Adds ~1 minute latency (cron interval) between event receipt and action execution.
- **Alternative considered**: Direct inline processing — rejected because it would block the webhook response and make retries impossible.

### DB-backed job queue instead of Redis/SQS
- **Why**: Free tier, no extra infrastructure, Prisma makes it easy to query.
- **Trade-off**: Polling-based (1 min cron) instead of push-based. Acceptable for this use case.
- **Scaling concern**: If event volume exceeds ~500/min, would need to move to a proper queue.

### Single global WEBHOOK_SECRET
- **Why**: Simplicity for MVP. All repos share one secret.
- **Trade-off**: If the secret is compromised, all repos are affected.
- **Future**: Per-repo secrets stored in the `Repo` table.

### JWT sessions instead of database sessions
- **Why**: Stateless, no session table needed, faster for serverless.
- **Trade-off**: Can't revoke individual sessions server-side. Acceptable for this app.

### OAuth access token stored in User table
- **Why**: Worker needs to make GitHub API calls on behalf of the user. The token must be available outside the request context.
- **Security note**: The token is stored in the database, not in cookies or client-side storage. The database should be properly secured.

## Idempotency

GitHub retries webhook deliveries with the same `X-GitHub-Delivery` header. The `githubDeliveryId` unique constraint on the `Event` table ensures:
1. First delivery: inserted, processed normally.
2. Retry delivery: insert fails with unique constraint violation (Prisma P2002), caught and returned 200.

This prevents duplicate label additions, duplicate comments, and duplicate Slack messages.

## Error Handling Strategy

1. **Webhook handler**: Verify signature → enqueue → return 200. Errors in enqueue are 500s.
2. **Worker**: Wraps each event in try/catch. Individual action failures are logged to `ActionLog` with `status=failed` but don't prevent other actions from executing.
3. **Retry policy**: Failed events are retried up to `MAX_RETRY_ATTEMPTS` (5). After that, status becomes `dead` — visible in dashboard.
4. **Slack**: If `SLACK_WEBHOOK_URL` is not configured, Slack notifications are silently skipped (warning logged).

## Known Limitations

- **No real-time updates**: Dashboard polls every 5 seconds via SWR. Full WebSocket support is overkill for the grading bar.
- **Token refresh**: GitHub OAuth tokens don't expire by default, but if the user revokes access, the stored token becomes invalid. No automatic refresh mechanism.
- **Single user per repo**: The current unique constraint `[userId, fullName]` allows multiple users to connect the same repo independently. This could cause duplicate webhooks. For production, would need a shared repo model.
- **No rate limiting**: The webhook endpoint has no rate limiting beyond HMAC verification. GitHub's retry behavior is the main concern.

## Stretch Goals Status

- [ ] AI triage with Gemini (infrastructure ready in `lib/ai/triage.ts`)
- [ ] Structured logging (ActionLog table provides this)
- [ ] GitHub App auth (JWT + installation tokens)
- [ ] Multi-repo dashboard view
- [ ] Telegram notifications
