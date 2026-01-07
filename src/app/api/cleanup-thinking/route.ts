import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cleanupThinkingMessageWithError, ThinkingErrorType } from "@/lib/thinking-helpers";

/**
 * Manual cleanup endpoint for orphaned thinking messages
 * GET /api/cleanup-thinking
 *
 * This provides a manual way to trigger cleanup, useful for debugging or emergency cleanup
 */
export async function GET() {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const fifteenMinutesAgo = new Date(Date.now() - 900000); // 15 minutes (consistent with cron job)

    // Find orphaned thinking messages
    const orphanedMessages = await prisma.message.findMany({
      where: {
        type: "THINKING",
        createdAt: { lt: fifteenMinutesAgo }
      },
      select: {
        id: true,
        projectId: true,
        createdAt: true
      }
    });

    if (orphanedMessages.length === 0) {
      return NextResponse.json({
        success: true,
        deleted: 0,
        message: "No orphaned thinking messages found"
      });
    }

    // Use unified cleanup function with parallel execution
    const cleanupResults = await Promise.allSettled(
      orphanedMessages.map(msg =>
        cleanupThinkingMessageWithError(
          msg.id,
          msg.projectId,
          ThinkingErrorType.AGENT_TIMEOUT
        )
      )
    );

    // Count successful cleanups
    const successCount = cleanupResults.filter(r => r.status === "fulfilled").length;
    const failureCount = cleanupResults.filter(r => r.status === "rejected").length;

    return NextResponse.json({
      success: true,
      deleted: successCount,
      failed: failureCount,
      message: `Successfully cleaned up ${successCount} orphaned thinking messages${failureCount > 0 ? ` (${failureCount} failed)` : ""}`,
      orphanedIds: orphanedMessages.map(m => m.id)
    });
  } catch (error) {
    console.error("Cleanup failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
