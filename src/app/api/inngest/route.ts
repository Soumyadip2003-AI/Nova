import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { codeAgentFunction  } from "../../../inngest/functions";
import { cleanupOrphanedThinkingMessages } from "../../../inngest/cleanup-thinking";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    codeAgentFunction , // <-- This is where you'll always add all your functions
    cleanupOrphanedThinkingMessages, // Cleanup cron job for orphaned thinking messages
  ],
});