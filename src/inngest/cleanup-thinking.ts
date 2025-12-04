import { inngest } from "./client";
import { prisma } from "@/lib/db";

/**
 * Cleanup cron job that runs every 5 minutes to delete orphaned thinking messages
 *
 * A thinking message is considered orphaned if:
 * - It's been in THINKING state for more than 5 minutes
 * - This indicates the agent crashed, failed, or was cancelled without cleanup
 */
export const cleanupOrphanedThinkingMessages = inngest.createFunction(
  {
    id: "cleanup-orphaned-thinking",
    name: "Cleanup Orphaned Thinking Messages"
  },
  { cron: "*/5 * * * *" }, // Run every 5 minutes
  async ({ step }) => {
    const result = await step.run("delete-orphaned-thinking", async () => {
      const fiveMinutesAgo = new Date(Date.now() - 300000); // 5 minutes

      // Find orphaned thinking messages
      const orphanedMessages = await prisma.message.findMany({
        where: {
          type: "THINKING",
          createAt: { lt: fiveMinutesAgo }
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

      // Delete orphaned messages and create error messages
      for (const orphaned of orphanedMessages) {
        // Delete the thinking message
        await prisma.message.delete({
          where: { id: orphaned.id }
        });

        // Create error message to show in UI
        await prisma.message.create({
          data: {
            projectId: orphaned.projectId,
            content: "Something went wrong. Please try again.",
            role: "ASSISTANT",
            type: "ERROR",
          },
        });
      }

      return {
        deleted: orphanedMessages.length,
        message: `Successfully deleted ${orphanedMessages.length} orphaned thinking messages`,
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
