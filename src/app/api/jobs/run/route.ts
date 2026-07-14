import { NextRequest, NextResponse } from "next/server";
import { processJobs } from "@/lib/jobs/worker";

/**
 * Cron job route — triggered by Vercel Cron (every 1 minute).
 * Protected by CRON_SECRET header check.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
  }

  try {
    const result = await processJobs();

    return NextResponse.json({
      message: "Jobs processed",
      ...result,
    });
  } catch (error) {
    console.error("Job processing error:", error);
    return NextResponse.json(
      { error: "Job processing failed" },
      { status: 500 }
    );
  }
}
