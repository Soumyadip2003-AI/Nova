import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { z } from "zod";
import { isDefinitelyQuestion } from "@/lib/question-detector";
import { generateChatResponse } from "@/lib/chat-agent";
import { createThinkingMessage, deleteThinkingMessage } from "@/lib/thinking-helpers";
import { TRPCError } from "@trpc/server";

export const messagesRouter = createTRPCRouter({
    getMany:protectedProcedure
    .input(
            z.object({
                projectId: z.string().min(1, { message: "Project ID is required" }),
            }),
        )
    .query(async({input,ctx})=>{
        const messages = await prisma.message.findMany({
            where:{
                projectId: input.projectId,
                project:{
                     userId: ctx.auth.userId,
                }
            },
            orderBy:{
                updatedAt: "asc",
            },
            include:{
                fragment: true,
            },
        });
        return messages;
    }),
    create: protectedProcedure
        .input(
            z.object({
                value: z.string()
                .min(1, { message: "Value is required" })
                .max(10000, { message: "Value is too long" }),
                projectId: z.string().min(1, { message: "Project ID is required" }),
            }),
        )
        .mutation(async ({ input, ctx }) => {
            // Verify the project belongs to the user
            const existingproject = await prisma.project.findUnique({
                where: {
                    id: input.projectId,
                    userId: ctx.auth.userId,
                },
            });

            if (!existingproject) {
                throw new TRPCError( {code: "NOT_FOUND", message: "Project not found"})
            }

            // Check if this is a question or a code generation request
            const isQuestion = isDefinitelyQuestion(input.value);

            if (isQuestion) {
                // Check and consume credits BEFORE processing
                // This prevents free questions if credit consumption fails later
                const { consumeCreditsForUser } = await import("@/lib/usage");
                try {
                    await consumeCreditsForUser(ctx.auth.userId);
                    console.log("✓ Credits consumed upfront before question processing");
                } catch {
                    throw new TRPCError({
                        code: "TOO_MANY_REQUESTS",
                        message: "You have run out of credits"
                    });
                }

                // Handle as a chat/question - fast path without Inngest
                const userMessage = await prisma.message.create({
                    data: {
                        projectId: existingproject.id,
                        content: input.value,
                        role: "USER",
                        type: "CHAT",
                    },
                });

                // Create thinking message for immediate user feedback
                const thinkingMessage = await createThinkingMessage(input.projectId);

                // Store userId for background processing
                const userId = ctx.auth.userId;

                // Process response asynchronously (don't await - return immediately)
                setImmediate(() => {
                    (async () => {
                        try {
                            // Generate chat response
                            const chatResponse = await generateChatResponse(input.projectId, input.value);

                            // Delete thinking message
                            await deleteThinkingMessage(thinkingMessage.id);

                            // Credits were already consumed upfront
                            console.log("✓ Question processed successfully - credits already consumed");

                            // Save assistant response
                            await prisma.message.create({
                                data: {
                                    projectId: input.projectId,
                                    content: chatResponse,
                                    role: "ASSISTANT",
                                    type: "CHAT",
                                },
                            });
                        } catch (error) {
                            // Refund credits since processing failed
                            const { refundCreditsForUser } = await import("@/lib/usage");
                            try {
                                await refundCreditsForUser(userId);
                                console.log("✓ Credits refunded after question processing failure");
                            } catch (refundError) {
                                console.error("✗ Failed to refund credits:", refundError);
                            }

                            // Delete thinking message on error
                            await deleteThinkingMessage(thinkingMessage.id);

                            // Save error message
                            await prisma.message.create({
                                data: {
                                    projectId: input.projectId,
                                    content: "Sorry, I encountered an error while processing your question. Please try again.",
                                    role: "ASSISTANT",
                                    type: "ERROR",
                                },
                            });

                            console.error("Chat response error (credits refunded):", error);
                        }
                    })();
                });

                // Return immediately after creating thinking message
                return userMessage;
            }

            // Check if user has credits (but don't consume yet - will consume after successful generation)
            const { getUsageStatus } = await import("@/lib/usage");
            const usageStatus = await getUsageStatus();

            if (usageStatus.remainingPoints < 1) {
                throw new TRPCError({
                    code: "TOO_MANY_REQUESTS",
                    message: "You have run out of credits"
                });
            }

            // Handle as a code generation request - uses Inngest
            const createdMessage = await prisma.message.create({
                data: {
                    projectId: input.projectId,
                    content: input.value,
                    role: "USER",
                    type: "RESULT",
                },
            });

            try {
                await inngest.send({
                    name: "code-agent/run",
                    data: {
                        value: input.value,
                        projectId: input.projectId,
                        userId: ctx.auth.userId,
                    }
                });
            } catch (error) {
                console.error("Failed to send Inngest event:", error);
                // Continue even if Inngest fails - message is already created
            }

            return createdMessage;
        }),
});