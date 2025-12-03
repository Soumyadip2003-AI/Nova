import { inngest } from "./client";
import { prisma } from "@/lib/db";

/**
 * Cleanup cron job that runs every 30 minutes to delete orphaned thinking messages
 *
 * A thinking message is considered orphaned if:
 * - It's been in THINKING state for more than 1 hour
 * - This indicates the agent crashed or failed without cleanup
 */
export const cleanupOrphanedThinkingMessages = inngest.createFunction(
  {
    id: "cleanup-orphaned-thinking",
    name: "Cleanup Orphaned Thinking Messages"
  },
  { cron: "*/30 * * * *" }, // Run every 30 minutes
  async ({ step }) => {
    const result = await step.run("delete-orphaned-thinking", async () => {
      const oneHourAgo = new Date(Date.now() - 3600000); // 1 hour

      // Find orphaned thinking messages
      const orphanedMessages = await prisma.message.findMany({
        where: {
          type: "THINKING",
          createAt: { lt: oneHourAgo }
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

      // Delete orphaned messages
      const deleteResult = await prisma.message.deleteMany({
        where: {
          type: "THINKING",
          createAt: { lt: oneHourAgo }
        }
      });

      return {
        deleted: deleteResult.count,
        message: `Successfully deleted ${deleteResult.count} orphaned thinking messages`,
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
