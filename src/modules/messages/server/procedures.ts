import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { z } from "zod";
import { isDefinitelyQuestion } from "@/lib/question-detector";
import { generateChatResponse } from "@/lib/chat-agent";
import { createThinkingMessage, deleteThinkingMessage } from "@/lib/thinking-helpers";
import { TRPCError } from "@trpc/server";
import { after } from "next/server";
import { EFFORTS } from "@/lib/models";
import { attachmentProblem, attachmentsSchema } from "@/lib/attachments";

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
                effort: z.enum(EFFORTS).optional(),
                attachments: attachmentsSchema.optional(),
            }),
        )
        .mutation(async ({ input, ctx }) => {
            // Verify the project belongs to the user and get its model
            const existingproject = await prisma.project.findUnique({
                where: {
                    id: input.projectId,
                    userId: ctx.auth.userId,
                },
                select: {
                    id: true,
                    model: true,
                },
            });

            if (!existingproject) {
                throw new TRPCError( {code: "NOT_FOUND", message: "Project not found"})
            }

            // Get the project's selected model
            // A project keeps its model, but a user who left Pro must not keep
            // using Pro models through an old project.
            const { getUsageStatus } = await import("@/lib/usage");
            const { isModelAvailable, getDefaultModel } = await import("@/lib/models");
            const isPro = (await getUsageStatus()).plan === "PRO";
            const savedModel = existingproject.model || "gpt-4o-mini";
            const projectModel = isModelAvailable(savedModel, isPro) ? savedModel : getDefaultModel(isPro);

            // Sending a message is activity on the project: keep "Updated ..."
            // and the project list order current.
            await prisma.project.update({
                where: { id: existingproject.id },
                data: { updatedAt: new Date() },
            });

            const attachments = input.attachments ?? [];
            const attachmentIssue = attachmentProblem(attachments, ctx.auth.userId, isPro ? "PRO" : "FREE");
            if (attachmentIssue) throw new TRPCError({ code: "BAD_REQUEST", message: attachmentIssue });

            // Check if this is a question or a code generation request. References
            // are sent to build with, so a message carrying them is always a build.
            const isQuestion = !attachments.length && isDefinitelyQuestion(input.value);

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

                // Answer after the response is sent. after() keeps the serverless
                // function alive until this finishes; setImmediate did not, so on
                // Vercel the answer could be lost with the credit already spent.
                after(() => {
                    return (async () => {
                        try {
                            // Generate chat response with project's model
                            const chatResponse = await generateChatResponse(input.projectId, input.value, projectModel);

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
                    ...(attachments.length ? { attachments } : {}),
                },
            });

            try {
                await inngest.send({
                    name: "code-agent/run",
                    data: {
                        value: input.value,
                        projectId: input.projectId,
                        userId: ctx.auth.userId,
                        model: projectModel,
                        effort: input.effort,
                        attachments,
                    }
                });
            } catch (error) {
                // Without the event no build ever starts: remove the message and
                // tell the user, instead of leaving it waiting forever.
                console.error("Failed to send Inngest event:", error);
                await prisma.message.delete({ where: { id: createdMessage.id } });
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Nova could not start this build. Please try again.",
                });
            }

            return createdMessage;
        }),
});