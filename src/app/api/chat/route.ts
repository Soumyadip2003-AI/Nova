import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateChatResponse, saveChatMessage } from "@/lib/chat-agent";
import { prisma } from "@/lib/db";
import {
  consumeCreditsForUser,
  getUsageStatus,
  InsufficientCreditsError,
  refundCreditsForUser,
} from "@/lib/usage";
import { RateLimiterMemory } from "rate-limiter-flexible";

const chatRateLimiter = new RateLimiterMemory({
  points: 20,
  duration: 60,
});

/**
 * Chat endpoint for answering questions about projects
 * POST /api/chat
 *
 * This is a fast, lightweight endpoint for conversational responses
 * that don't require code generation or sandbox execution
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  let creditsConsumed = false;

  try {
    const body = await request.json();
    const { projectId, message } = body;

    if (!projectId || !message) {
      return NextResponse.json(
        { success: false, error: "projectId and message are required" },
        { status: 400 }
      );
    }

    try {
      await chatRateLimiter.consume(`chat:${userId}`);
    } catch (error) {
      const retryAfter =
        typeof error === "object" && error && "msBeforeNext" in error
          ? Math.ceil(Number(error.msBeforeNext) / 1000)
          : 60;

      return NextResponse.json(
        { success: false, error: "Too many requests" },
        {
          status: 429,
          headers: { "Retry-After": retryAfter.toString() },
        }
      );
    }

    // Verify project exists and belongs to the user
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    // Sync plan status and check credits before consuming
    const usageStatus = await getUsageStatus();
    if (usageStatus.remainingPoints < 1) {
      return NextResponse.json(
        { success: false, error: "You have run out of credits" },
        { status: 429 }
      );
    }

    await consumeCreditsForUser(userId);
    creditsConsumed = true;

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
    if (creditsConsumed) {
      try {
        await refundCreditsForUser(userId);
      } catch (refundError) {
        console.error("Chat refund failed:", refundError);
      }
    }

    if (error instanceof InsufficientCreditsError) {
      return NextResponse.json(
        { success: false, error: "You have run out of credits" },
        { status: 429 }
      );
    }

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
