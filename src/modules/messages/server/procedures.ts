import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { z } from "zod"

export const messagesRouter = createTRPCRouter({
    getMany: baseProcedure
    .query(async()=>{
        const messages = await prisma.message.findMany({
            orderBy:{
                updatedAt: "desc",
            },
           
        });
        return messages;
    }),
    create: baseProcedure
        .input(
            z.object({
                value: z.string().min(1, { message: "Message is required" }),
            }),
        )
        .mutation(async ({ input }) => {
            try {
                console.log('[messages.create] Starting, input:', input);

                const createdMessage = await prisma.message.create({
                    data: {
                        content: input.value,
                        role: "USER",
                        type: "RESULT",
                    },
                });
                console.log('[messages.create] Message created:', createdMessage.id);

                await inngest.send({
                    name: "code-agent/run",
                    data: {
                        value: input.value,
                    }
                });
                console.log('[messages.create] Inngest event sent');

                return createdMessage;
            } catch (error) {
                console.error('[messages.create] Error:', error);
                throw error;
            }
        }),
});