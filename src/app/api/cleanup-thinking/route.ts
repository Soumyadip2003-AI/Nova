import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deleteThinkingMessage } from "@/lib/thinking-helpers";

/**
 * Manual cleanup endpoint for orphaned thinking messages
 * GET /api/cleanup-thinking
 */
export async function GET() {
  try {
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
      return NextResponse.json({
        success: true,
        deleted: 0,
        message: "No orphaned thinking messages found"
      });
    }

    // Delete each orphaned message
    const deletePromises = orphanedMessages.map(msg =>
      deleteThinkingMessage(msg.id)
    );
    await Promise.all(deletePromises);

    // Create error messages for each project
    const errorMessagePromises = orphanedMessages.map(msg =>
      prisma.message.create({
        data: {
          projectId: msg.projectId,
          content: "Something went wrong. Please try again.",
          role: "ASSISTANT",
          type: "ERROR",
        },
      })
    );
    await Promise.all(errorMessagePromises);

    return NextResponse.json({
      success: true,
      deleted: orphanedMessages.length,
      message: `Successfully cleaned up ${orphanedMessages.length} orphaned thinking messages`,
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
