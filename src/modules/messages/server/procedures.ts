import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { z } from "zod";
import { isDefinitelyQuestion } from "@/lib/question-detector";
import { generateChatResponse } from "@/lib/chat-agent";
import { createThinkingMessage, deleteThinkingMessage } from "@/lib/thinking-helpers";

export const messagesRouter = createTRPCRouter({
    getMany: baseProcedure
    .input(
            z.object({
                projectId: z.string().min(1, { message: "Project ID is required" }),
            }),
        )
    .query(async({input})=>{
        const messages = await prisma.message.findMany({
            where:{
                projectId: input.projectId,
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
    create: baseProcedure
        .input(
            z.object({
                value: z.string()
                .min(1, { message: "Value is required" })
                .max(10000, { message: "Value is too long" }),
                projectId: z.string().min(1, { message: "Project ID is required" }),
            }),
        )
        .mutation(async ({ input }) => {
            // Check if this is a question or a code generation request
            const isQuestion = isDefinitelyQuestion(input.value);

            if (isQuestion) {
                // Handle as a chat/question - fast path without Inngest
                const userMessage = await prisma.message.create({
                    data: {
                        projectId: input.projectId,
                        content: input.value,
                        role: "USER",
                        type: "CHAT",
                    },
                });

                // Create thinking message for immediate user feedback
                const thinkingMessage = await createThinkingMessage(input.projectId);

                // Process response asynchronously (don't await - return immediately)
                setImmediate(() => {
                    (async () => {
                        try {
                            // Generate chat response
                            const chatResponse = await generateChatResponse(input.projectId, input.value);

                            // Delete thinking message
                            await deleteThinkingMessage(thinkingMessage.id);

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

                            console.error("Chat response error:", error);
                        }
                    })();
                });

                // Return immediately after creating thinking message
                return userMessage;
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

            await inngest.send({
                name: "code-agent/run",
                data: {
                    value: input.value,
                    projectId: input.projectId,
                }
            });


            return createdMessage;
        }),
});