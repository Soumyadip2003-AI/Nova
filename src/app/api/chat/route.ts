import { NextRequest, NextResponse } from "next/server";
import { generateChatResponse, saveChatMessage } from "@/lib/chat-agent";
import { prisma } from "@/lib/db";

/**
 * Chat endpoint for answering questions about projects
 * POST /api/chat
 *
 * This is a fast, lightweight endpoint for conversational responses
 * that don't require code generation or sandbox execution
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, message } = body;

    if (!projectId || !message) {
      return NextResponse.json(
        { success: false, error: "projectId and message are required" },
        { status: 400 }
      );
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    // Save user message
    await saveChatMessage(projectId, message, "USER");

    // Generate chat response
    const response = await generateChatResponse(projectId, message);

    // Save assistant response
    await saveChatMessage(projectId, response, "ASSISTANT");

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (error) {
    console.error("Chat failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
