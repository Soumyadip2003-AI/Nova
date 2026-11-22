import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db";
import { protectedProcedure, createTRPCRouter } from "@/trpc/init";
import { z } from "zod"
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
                            createdAt: "desc",
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
                model: z.string().optional(),
            }),
        )
        .mutation(async ({ input ,ctx}) => {
            // Check if user has credits (but don't consume yet - will consume after successful generation)
            const { getUsageStatus } = await import("@/lib/usage");
            const { isModelAvailable, getDefaultModel } = await import("@/lib/models");
            const usageStatus = await getUsageStatus();

            if (usageStatus.remainingPoints < 1) {
                throw new TRPCError({
                    code: "TOO_MANY_REQUESTS",
                    message: "You have run out of credits"
                });
            }

            // Validate and determine model based on user plan
            const isPro = usageStatus.plan === "PRO";
            let selectedModel = input.model;
            if (!selectedModel || !isModelAvailable(selectedModel, isPro)) {
                selectedModel = getDefaultModel(isPro);
            }

            // Use first 50 characters of user message as project name
            const projectName = input.value.length > 50
                ? input.value.substring(0, 50) + "..."
                : input.value;

            const createdProject = await prisma.project.create({
                data: {
                    userId:ctx.auth.userId,
                    name: projectName,
                    model: selectedModel,
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
                        userId: ctx.auth.userId,
                        model: selectedModel,
                    }
                });
            } catch (error) {
                // Without the event no build ever starts: remove the empty
                // project and tell the user, instead of leaving it stuck.
                console.error("Failed to send Inngest event:", error);
                await prisma.project.delete({ where: { id: createdProject.id } });
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Nova could not start this build. Please try again.",
                });
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
    // Previews run in sandboxes that stop after a few minutes. These let the
    // workspace notice a stopped preview and start it again from the saved
    // code, without a new build and without using a credit.
    previewAlive: protectedProcedure
        .input(z.object({ fragmentId: z.string().min(1) }))
        .query(async ({ input, ctx }) => {
            const fragment = await prisma.fragment.findFirst({
                where: { id: input.fragmentId, message: { project: { userId: ctx.auth.userId } } },
                select: { sandboxUrl: true },
            });
            if (!fragment) throw new TRPCError({ code: "NOT_FOUND", message: "Version not found" });
            const { isPreviewAlive } = await import("@/lib/preview");
            return { alive: await isPreviewAlive(fragment.sandboxUrl) };
        }),
    restartPreview: protectedProcedure
        .input(z.object({ fragmentId: z.string().min(1) }))
        .mutation(async ({ input, ctx }) => {
            const fragment = await prisma.fragment.findFirst({
                where: { id: input.fragmentId, message: { project: { userId: ctx.auth.userId } } },
            });
            if (!fragment) throw new TRPCError({ code: "NOT_FOUND", message: "Version not found" });

            const { isPreviewAlive, startPreview } = await import("@/lib/preview");
            // Already running (or restarted a moment ago): reuse it instead of
            // starting another paid sandbox.
            if (await isPreviewAlive(fragment.sandboxUrl)) return fragment;

            const { getUsageStatus } = await import("@/lib/usage");
            const isPro = (await getUsageStatus()).plan === "PRO";
            const sandboxUrl = await startPreview(fragment.files as Record<string, string>, isPro);
            return prisma.fragment.update({ where: { id: fragment.id }, data: { sandboxUrl } });
        }),
    updateModel: protectedProcedure
        .input(
            z.object({
                id: z.string().min(1, { message: "ID is required" }),
                model: z.string().min(1, { message: "Model is required" }),
            }),
        )
        .mutation(async ({ input, ctx }) => {
            const { isModelAvailable } = await import("@/lib/models");
            const { getUsageStatus } = await import("@/lib/usage");

            // Verify project ownership
            const existingProject = await prisma.project.findUnique({
                where: {
                    id: input.id,
                    userId: ctx.auth.userId,
                },
            });

            if (!existingProject) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Project not found",
                });
            }

            // Validate model based on user plan
            const usageStatus = await getUsageStatus();
            const isPro = usageStatus.plan === "PRO";

            if (!isModelAvailable(input.model, isPro)) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "This model requires a Pro subscription",
                });
            }

            const updatedProject = await prisma.project.update({
                where: { id: input.id },
                data: { model: input.model },
            });

            return updatedProject;
        }),
});