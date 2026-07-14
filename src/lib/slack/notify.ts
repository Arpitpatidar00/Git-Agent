/**
 * Sends a notification to Slack via an Incoming Webhook.
 * Simple POST with a JSON body — no SDK needed.
 */
export async function sendSlackNotification(message: string): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("SLACK_WEBHOOK_URL is not configured — skipping Slack notification");
    return;
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: message,
      unfurl_links: false,
      unfurl_media: false,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Slack notification failed: ${response.status} ${response.statusText}`
    );
  }
}

/**
 * Formats an event into a readable Slack message.
 */
export function formatSlackMessage(
  repoFullName: string,
  eventType: string,
  action: string | null,
  title: string,
  url: string,
  actionsTaken: string[]
): string {
  const actionStr = action ? ` (${action})` : "";
  const actionsDesc = actionsTaken.length > 0
    ? `\n• Actions: ${actionsTaken.join(", ")}`
    : "";

  return (
    `🤖 *GitHub Automation Bot*\n` +
    `📦 *Repo:* ${repoFullName}\n` +
    `📌 *Event:* \`${eventType}\`${actionStr}\n` +
    `📝 *Title:* ${title}\n` +
    `🔗 <${url}|View on GitHub>${actionsDesc}`
  );
}
