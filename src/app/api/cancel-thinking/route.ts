import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cleanupThinkingMessageWithError, ThinkingErrorType } from "@/lib/thinking-helpers";
import { inngest } from "@/inngest/client";

/**
 * Cancel endpoint for active thinking operations
 * POST /api/cancel-thinking
 *
 * Allows users to cancel long-running thinking processes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "projectId is required" },
        { status: 400 }
      );
    }

    // Find the active thinking message for this project
    const thinkingMessage = await prisma.message.findFirst({
      where: {
        projectId,
        type: "THINKING"
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!thinkingMessage) {
      return NextResponse.json({
        success: false,
        error: "No active thinking process found"
      }, { status: 404 });
    }

    // Send cancel event to Inngest to actually stop the running function
    await inngest.send({
      name: "code-agent/cancel",
      data: {
        projectId,
      },
    });

    // Cleanup the thinking message with cancelled error type
    await cleanupThinkingMessageWithError(
      thinkingMessage.id,
      projectId,
      ThinkingErrorType.CANCELLED
    );

    return NextResponse.json({
      success: true,
      message: "Thinking process cancelled successfully",
      messageId: thinkingMessage.id
    });
  } catch (error) {
    console.error("Cancel thinking failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
