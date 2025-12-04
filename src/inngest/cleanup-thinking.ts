import { inngest } from "./client";
import { prisma } from "@/lib/db";
import { cleanupThinkingMessageWithError } from "@/lib/thinking-helpers";

/**
 * Cleanup cron job that runs every 5 minutes to delete orphaned thinking messages
 *
 * A thinking message is considered orphaned if:
 * - It's been in THINKING state for more than 10 minutes
 * - This indicates the agent crashed, failed, or was cancelled without cleanup
 *
 * Note: 10 minutes allows for complex operations with up to 15 agent iterations
 */
export const cleanupOrphanedThinkingMessages = inngest.createFunction(
  {
    id: "cleanup-orphaned-thinking",
    name: "Cleanup Orphaned Thinking Messages"
  },
  { cron: "*/5 * * * *" }, // Run every 5 minutes
  async ({ step }) => {
    const result = await step.run("delete-orphaned-thinking", async () => {
      const tenMinutesAgo = new Date(Date.now() - 600000); // 10 minutes (increased from 5)

      // Find orphaned thinking messages
      const orphanedMessages = await prisma.message.findMany({
        where: {
          type: "THINKING",
          createAt: { lt: tenMinutesAgo }
        },
        select: {
          id: true,
          projectId: true,
          createAt: true
        }
      });

      if (orphanedMessages.length === 0) {
        return {
          deleted: 0,
          message: "No orphaned thinking messages found"
        };
      }

      // Log orphaned messages for monitoring
      console.warn(
        `Found ${orphanedMessages.length} orphaned thinking messages:`,
        orphanedMessages.map(m => ({
          id: m.id,
          projectId: m.projectId,
          age: Math.floor((Date.now() - m.createAt.getTime()) / 60000) + " minutes"
        }))
      );

      // Use unified cleanup function with parallel execution for better performance
      const cleanupResults = await Promise.allSettled(
        orphanedMessages.map(orphaned =>
          cleanupThinkingMessageWithError(
            orphaned.id,
            orphaned.projectId,
            "The task took too long and was terminated. Please try again."
          )
        )
      );

      // Count successful cleanups
      const successCount = cleanupResults.filter(r => r.status === "fulfilled").length;
      const failureCount = cleanupResults.filter(r => r.status === "rejected").length;

      if (failureCount > 0) {
        console.error(`${failureCount} cleanup operations failed`);
      }

      return {
        deleted: successCount,
        failed: failureCount,
        message: `Successfully deleted ${successCount} orphaned thinking messages${failureCount > 0 ? ` (${failureCount} failed)` : ""}`,
        orphanedIds: orphanedMessages.map(m => m.id)
      };
    });

    // Log the result
    if (result.deleted > 0) {
      console.info(`Cleanup job completed: ${result.message}`);
    }

    return result;
  }
);
