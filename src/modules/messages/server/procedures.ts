import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { z } from "zod";
import { isDefinitelyQuestion } from "@/lib/question-detector";
import { generateChatResponse } from "@/lib/chat-agent";

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

                // Generate chat response
                const chatResponse = await generateChatResponse(input.projectId, input.value);

                // Save assistant response
                await prisma.message.create({
                    data: {
                        projectId: input.projectId,
                        content: chatResponse,
                        role: "ASSISTANT",
                        type: "CHAT",
                    },
                });

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