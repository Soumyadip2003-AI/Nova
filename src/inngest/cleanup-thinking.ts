import { inngest } from "./client";
import { prisma } from "@/lib/db";
import { ERROR_MESSAGES, ThinkingErrorType } from "@/lib/thinking-helpers";
import { refundCreditsForUser } from "@/lib/usage";

// A build is stuck when its thinking log has not changed for this long. Every
// step the agent takes rewrites the log (and so bumps updatedAt); the longest
// single step is one model call, which Vercel caps at 300 seconds.
export const STALL_MS = 10 * 60 * 1000;
// Upper bound for any build, even one still making progress.
export const MAX_BUILD_MS = 45 * 60 * 1000;

/**
 * Stops builds that are stuck: cancels the Inngest run, replaces the thinking
 * message with an error and refunds the credit.
 *
 * Builds used to be judged by age alone (15 minutes after they started), so a
 * large build on GPT-6.2 Sol or Astra that was still working was killed, shown
 * as "took too long", left running in the background and not refunded.
 */
export async function stopStalledBuilds(now = Date.now()) {
  const stalled = await prisma.message.findMany({
    where: {
      type: "THINKING",
      OR: [
        { updatedAt: { lt: new Date(now - STALL_MS) } },
        { createdAt: { lt: new Date(now - MAX_BUILD_MS) } },
      ],
    },
    select: { id: true, projectId: true, project: { select: { userId: true } } },
  });

  let stopped = 0;
  for (const msg of stalled) {
    await inngest.send({ name: "code-agent/cancel", data: { projectId: msg.projectId } });
    // deleteMany so a build that finished or failed meanwhile (and already
    // removed its thinking message, and refunded if needed) is left alone.
    const { count } = await prisma.message.deleteMany({ where: { id: msg.id, type: "THINKING" } });
    if (!count) continue;
    await prisma.message.create({
      data: {
        projectId: msg.projectId,
        content: ERROR_MESSAGES[ThinkingErrorType.AGENT_TIMEOUT](),
        role: "ASSISTANT",
        type: "ERROR",
      },
    });
    await refundCreditsForUser(msg.project.userId).catch((e) => console.error("Refund after stalled build failed:", e));
    stopped++;
  }
  return { found: stalled.length, stopped };
}

export const cleanupOrphanedThinkingMessages = inngest.createFunction(
  {
    id: "cleanup-orphaned-thinking",
    name: "Cleanup Orphaned Thinking Messages"
  },
  { cron: "*/5 * * * *" }, // Run every 5 minutes
  async ({ step }) => {
    const result = await step.run("stop-stalled-builds", () => stopStalledBuilds());
    if (result.stopped > 0) console.warn(`Stopped ${result.stopped} stalled build(s)`);
    return result;
  }
);
