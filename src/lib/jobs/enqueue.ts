import { prisma } from "@/lib/db/prisma";
import { JOB_STATUS } from "@/constants";
import type { Prisma } from "@prisma/client";

/**
 * Enqueues a GitHub event for processing by the worker.
 * Returns the created event, or null if the event was already processed (duplicate delivery).
 */
export async function enqueueEvent(
  repoId: string,
  eventType: string,
  action: string | null,
  payload: Record<string, unknown>,
  deliveryId: string,
) {
  try {
    const event = await prisma.event.create({
      data: {
        repoId,
        githubDeliveryId: deliveryId,
        eventType,
        action,
        payload: payload as Prisma.InputJsonValue,
        status: JOB_STATUS.RECEIVED,
      },
    });
    return event;
  } catch (error: unknown) {
    // Unique constraint violation on githubDeliveryId — already processed
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return null;
    }
    throw error;
  }
}
