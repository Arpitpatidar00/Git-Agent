import { prisma } from "@/lib/db/prisma";
import { createOctokitClient } from "@/lib/github/client";
import { addLabel, postComment } from "@/lib/github/actions";
import { sendSlackNotification, formatSlackMessage } from "@/lib/slack/notify";
import { evaluateRules, ActionToExecute } from "@/lib/rules/engine";
import {
  JOB_STATUS,
  ACTION_TYPES,
  ACTION_LOG_STATUS,
  MAX_RETRY_ATTEMPTS,
  JOB_BATCH_SIZE,
} from "@/constants";

/**
 * Extracts issue/PR number and title from a GitHub event payload.
 */
function extractEventDetails(payload: Record<string, unknown>) {
  const issue = payload.issue as Record<string, unknown> | undefined;
  const pr = payload.pull_request as Record<string, unknown> | undefined;
  const primary = issue || pr;

  return {
    number: (primary?.number as number) || 0,
    title: (primary?.title as string) || "Unknown",
    htmlUrl: (primary?.html_url as string) || "",
  };
}

/**
 * Executes a single action and logs the result.
 */
async function executeAction(
  action: ActionToExecute,
  eventId: string,
  owner: string,
  repo: string,
  issueNumber: number,
  accessToken: string,
  repoFullName: string,
  eventType: string,
  eventAction: string | null,
  title: string,
  htmlUrl: string,
): Promise<string> {
  const octokit = createOctokitClient(accessToken);

  try {
    switch (action.actionType) {
      case ACTION_TYPES.ADD_LABEL:
        await addLabel(octokit, owner, repo, issueNumber, action.actionValue);
        break;

      case ACTION_TYPES.COMMENT:
        await postComment(
          octokit,
          owner,
          repo,
          issueNumber,
          action.actionValue,
        );
        break;

      case ACTION_TYPES.SLACK_NOTIFY: {
        const message = formatSlackMessage(
          repoFullName,
          eventType,
          eventAction,
          title,
          htmlUrl,
          [action.actionValue],
        );
        await sendSlackNotification(message);
        break;
      }

      default:
        throw new Error(`Unknown action type: ${action.actionType}`);
    }

    await prisma.actionLog.create({
      data: {
        eventId,
        type: action.logType,
        status: ACTION_LOG_STATUS.SUCCESS,
        detail: `${action.actionType}: ${action.actionValue}`,
      },
    });

    return `${action.actionType}:success`;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    await prisma.actionLog.create({
      data: {
        eventId,
        type: action.logType,
        status: ACTION_LOG_STATUS.FAILED,
        detail: `${action.actionType}: ${action.actionValue} — Error: ${errorMessage}`,
      },
    });

    return `${action.actionType}:failed`;
  }
}

/**
 * Processes queued events.
 *
 * Picks events with status=received (oldest first), evaluates rules,
 * executes actions, writes ActionLog entries, and marks events done/failed/dead.
 *
 * Called by the cron route (/api/jobs/run).
 */
export async function processJobs(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const events = await prisma.event.findMany({
    where: {
      status: { in: [JOB_STATUS.RECEIVED, JOB_STATUS.FAILED] },
      attempts: { lt: MAX_RETRY_ATTEMPTS },
    },
    orderBy: { createdAt: "asc" },
    take: JOB_BATCH_SIZE,
    include: {
      repo: {
        include: {
          rules: true,
          user: true,
        },
      },
    },
  });

  let succeeded = 0;
  let failed = 0;

  for (const event of events) {
    // Mark as processing
    await prisma.event.update({
      where: { id: event.id },
      data: {
        status: JOB_STATUS.PROCESSING,
        attempts: { increment: 1 },
      },
    });

    try {
      const payload = event.payload as Record<string, unknown>;
      const rules = event.repo.rules;
      const accessToken = event.repo.user.accessToken;

      if (!accessToken) {
        throw new Error(
          "User access token not found — cannot make GitHub API calls",
        );
      }

      // Evaluate rules
      const actionsToExecute = evaluateRules(event.eventType, payload, rules);

      if (actionsToExecute.length === 0) {
        // No rules matched — mark as done
        await prisma.event.update({
          where: { id: event.id },
          data: { status: JOB_STATUS.DONE },
        });
        succeeded++;
        continue;
      }

      // Extract event details for action execution
      const [owner, repo] = event.repo.fullName.split("/");
      const {
        number: issueNumber,
        title,
        htmlUrl,
      } = extractEventDetails(payload);

      // Execute all matched actions
      const results: string[] = [];
      for (const action of actionsToExecute) {
        const result = await executeAction(
          action,
          event.id,
          owner,
          repo,
          issueNumber,
          accessToken,
          event.repo.fullName,
          event.eventType,
          event.action,
          title,
          htmlUrl,
        );
        results.push(result);
      }

      const hasFailure = results.some((r) => r.endsWith(":failed"));
      await prisma.event.update({
        where: { id: event.id },
        data: {
          status: hasFailure ? JOB_STATUS.FAILED : JOB_STATUS.DONE,
          lastError: hasFailure
            ? `Some actions failed: ${results.filter((r) => r.endsWith(":failed")).join(", ")}`
            : null,
        },
      });

      if (hasFailure) {
        failed++;
      } else {
        succeeded++;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const newAttempts = event.attempts + 1;

      await prisma.event.update({
        where: { id: event.id },
        data: {
          status:
            newAttempts >= MAX_RETRY_ATTEMPTS
              ? JOB_STATUS.DEAD
              : JOB_STATUS.FAILED,
          lastError: errorMessage,
        },
      });

      failed++;
    }
  }

  return { processed: events.length, succeeded, failed };
}
