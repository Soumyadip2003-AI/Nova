import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db";
import { protectedProcedure, createTRPCRouter } from "@/trpc/init";
import { z } from "zod"
import { generateSlug } from "random-word-slugs"
import { TRPCError } from "@trpc/server";

export const projectsRouter = createTRPCRouter({
    getMany: protectedProcedure
        .query(async ({ctx}) => {
            const projects = await prisma.project.findMany({
                where:{
                    userId: ctx.auth.userId,
                },
                orderBy: {
                    updatedAt: "desc",
                },
                include: {
                    messages: {
                        take: 1,
                        orderBy: {
                            createdAt: "asc",
                        },
                        where: {
                            role: "USER",
                        },
                    },
                },
            });
            return projects;
        }),
    getOne: protectedProcedure
     .input(z.object({
        id:z.string().min(1, { message: " ID is required" }),
     }))
     .query(async ({input,ctx}) => {
            const existingProject = await prisma.project.findUnique({
                where:{
                    id:input.id,
                    userId: ctx.auth.userId,
                },
            });
            if(!existingProject){
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Project not found",
                });
            }
            return existingProject;
        }),
    create: protectedProcedure
        .input(
            z.object({
                value: z.string()
                .min(1, { message: "Value is required" })
                .max(10000, { message: "Value is too long" }),
            }),
        )
        .mutation(async ({ input ,ctx}) => {

            const createdProject = await prisma.project.create({
                data: {
                    userId:ctx.auth.userId,
                    name: generateSlug(2, {
                        format: "kebab",
                    }),
                    messages: {
                        create: {
                            content: input.value,
                            role: "USER",
                            type: "RESULT",
                        },
                    },
                },
            });

            try {
                await inngest.send({
                    name: "code-agent/run",
                    data: {
                        value: input.value,
                        projectId: createdProject.id,
                    }
                });
            } catch (error) {
                console.error("Failed to send Inngest event:", error);
                // Continue even if Inngest fails - project is already created
            }

            return createdProject;

        }),
    remove: protectedProcedure
        .input(
            z.object({
                id: z.string().min(1, { message: "ID is required" }),
            }),
        )
        .mutation(async ({ input ,ctx}) => {
            const existingProject = await prisma.project.findUnique({
                where: {
                    userId: ctx.auth.userId,
                    id: input.id,
                },
            });

            if (!existingProject) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Project not found",
                });
            }

            await prisma.project.delete({
                where: {
                    id: input.id,
                    userId: ctx.auth.userId,
                },
            });

            return { success: true };
        }),
});