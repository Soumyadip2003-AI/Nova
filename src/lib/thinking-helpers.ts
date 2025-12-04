import { prisma } from "@/lib/db";
import { z } from "zod";

// Zod schemas for runtime validation
export const ThinkingStepSchema = z.object({
    title: z.string().min(1, "Step title cannot be empty"),
    content: z.string(),
    completed: z.boolean()
});

export const ThinkingDataSchema = z.object({
    steps: z.array(ThinkingStepSchema)
});

// TypeScript types derived from Zod schemas
export type ThinkingStep = z.infer<typeof ThinkingStepSchema>;
export type ThinkingData = z.infer<typeof ThinkingDataSchema>;

/**
 * Type guard to check if data is valid ThinkingData
 * @param data - Unknown data to validate
 * @returns True if data is valid ThinkingData
 */
export function isThinkingData(data: unknown): data is ThinkingData {
    return ThinkingDataSchema.safeParse(data).success;
}

/**
 * Creates a new thinking message for tracking AI reasoning steps
 * @param projectId - The project ID
 * @returns The created thinking message
 */
export async function createThinkingMessage(projectId: string) {
    return await prisma.message.create({
        data: {
            projectId,
            role: "ASSISTANT",
            type: "THINKING",
            content: "Thinking...",
            thinking: {
                steps: []
            }
        }
    });
}

/**
 * Adds a new thinking step to an existing thinking message
 * @param messageId - The thinking message ID
 * @param title - Step title (e.g., "Analyzing request")
 * @param content - Optional detailed content for the step
 */
export async function addThinkingStep(
    messageId: string,
    title: string,
    content: string = ""
) {
    // Validate input
    const stepValidation = ThinkingStepSchema.safeParse({
        title,
        content,
        completed: false
    });

    if (!stepValidation.success) {
        console.error(`Invalid thinking step data:`, stepValidation.error);
        throw new Error(`Invalid thinking step: ${stepValidation.error.message}`);
    }

    const message = await prisma.message.findUnique({
        where: { id: messageId },
    });

    if (!message) {
        console.warn(`Thinking message ${messageId} not found, likely already deleted`);
        return null;
    }

    if (message.type !== "THINKING") {
        console.warn(`Message ${messageId} is not a thinking message`);
        return message;
    }

    let thinking = (message.thinking as any as ThinkingData) || { steps: [] };

    // Validate existing thinking data
    if (!isThinkingData(thinking)) {
        console.error(`Invalid thinking data structure for message ${messageId}`);
        // Reset to valid structure
        thinking = { steps: [] };
    }

    thinking.steps.push({
        title,
        content,
        completed: false
    });

    return await prisma.message.update({
        where: { id: messageId },
        data: { thinking: thinking as any }
    });
}

/**
 * Marks the current thinking step as completed
 * @param messageId - The thinking message ID
 */
export async function completeCurrentThinkingStep(messageId: string) {
    const message = await prisma.message.findUnique({
        where: { id: messageId },
    });

    if (!message) {
        console.warn(`Thinking message ${messageId} not found, likely already deleted`);
        return null;
    }

    if (message.type !== "THINKING") {
        console.warn(`Message ${messageId} is not a thinking message`);
        return message;
    }

    const thinking = message.thinking as any as ThinkingData;
    if (!thinking || !thinking.steps.length) {
        return message;
    }

    // Find the first incomplete step and mark it as completed
    const currentStepIndex = thinking.steps.findIndex(step => !step.completed);
    if (currentStepIndex !== -1) {
        thinking.steps[currentStepIndex].completed = true;
    }

    return await prisma.message.update({
        where: { id: messageId },
        data: { thinking: thinking as any }
    });
}

/**
 * Updates the content of the current thinking step
 * @param messageId - The thinking message ID
 * @param content - New content for the current step
 */
export async function updateCurrentThinkingStepContent(
    messageId: string,
    content: string
) {
    const message = await prisma.message.findUnique({
        where: { id: messageId },
    });

    if (!message) {
        console.warn(`Thinking message ${messageId} not found, likely already deleted`);
        return null;
    }

    if (message.type !== "THINKING") {
        console.warn(`Message ${messageId} is not a thinking message`);
        return message;
    }

    const thinking = message.thinking as any as ThinkingData;
    if (!thinking || !thinking.steps.length) {
        return message;
    }

    // Find the current incomplete step and update its content
    const currentStepIndex = thinking.steps.findIndex(step => !step.completed);
    if (currentStepIndex !== -1) {
        thinking.steps[currentStepIndex].content = content;
    }

    return await prisma.message.update({
        where: { id: messageId },
        data: { thinking: thinking as any }
    });
}

/**
 * Deletes the thinking message (call this when AI finishes generating)
 * @param messageId - The thinking message ID
 */
export async function deleteThinkingMessage(messageId: string) {
    try {
        return await prisma.message.delete({
            where: { id: messageId }
        });
    } catch (error) {
        console.warn(`Failed to delete thinking message ${messageId}:`, error);
        return null;
    }
}

/**
 * Unified cleanup function that deletes a thinking message and creates an error message
 * Used across all cleanup paths (onFailure, scheduled cleanup, manual API)
 * @param messageId - The thinking message ID to delete
 * @param projectId - The project ID for the error message
 * @param errorMessage - The error message content to display
 * @returns Object with success status and any error
 */
export async function cleanupThinkingMessageWithError(
    messageId: string,
    projectId: string,
    errorMessage: string = "Something went wrong. Please try again."
) {
    try {
        // Use transaction to ensure atomicity - either both operations succeed or both fail
        await prisma.$transaction([
            prisma.message.delete({
                where: { id: messageId }
            }),
            prisma.message.create({
                data: {
                    projectId,
                    content: errorMessage,
                    role: "ASSISTANT",
                    type: "ERROR",
                },
            }),
        ]);

        return { success: true, messageId, projectId };
    } catch (error) {
        console.error(`Failed to cleanup thinking message ${messageId}:`, error);

        // Try to at least create the error message for user feedback
        try {
            await prisma.message.create({
                data: {
                    projectId,
                    content: errorMessage,
                    role: "ASSISTANT",
                    type: "ERROR",
                },
            });
        } catch (createError) {
            console.error(`Failed to create error message:`, createError);
        }

        return { success: false, error, messageId, projectId };
    }
}

/**
 * Get statistics about thinking messages for monitoring
 * @returns Stats about thinking messages
 */
export async function getThinkingMessageStats() {
    const fiveMinutesAgo = new Date(Date.now() - 300000); // 5 minutes
    const oneHourAgo = new Date(Date.now() - 3600000); // 1 hour

    const [total, recent, stale, veryOld] = await Promise.all([
        // Total thinking messages
        prisma.message.count({
            where: { type: "THINKING" }
        }),
        // Recent thinking messages (< 5 minutes old)
        prisma.message.count({
            where: {
                type: "THINKING",
                createAt: { gte: fiveMinutesAgo }
            }
        }),
        // Stale thinking messages (5-60 minutes old)
        prisma.message.count({
            where: {
                type: "THINKING",
                createAt: {
                    gte: oneHourAgo,
                    lt: fiveMinutesAgo
                }
            }
        }),
        // Very old thinking messages (> 1 hour - should be cleaned up)
        prisma.message.count({
            where: {
                type: "THINKING",
                createAt: { lt: oneHourAgo }
            }
        })
    ]);

    // Log warning if there are orphaned messages
    if (veryOld > 0) {
        console.warn(`⚠️  Found ${veryOld} orphaned thinking messages older than 1 hour`);
    }

    return {
        total,
        recent,
        stale,
        orphaned: veryOld,
        healthStatus: veryOld === 0 ? "healthy" : veryOld < 5 ? "warning" : "critical"
    };
}

/**
 * Get detailed information about orphaned thinking messages
 * @param olderThanMinutes - Get messages older than this many minutes (default: 60)
 * @returns List of orphaned thinking messages
 */
export async function getOrphanedThinkingMessages(olderThanMinutes: number = 60) {
    const cutoffTime = new Date(Date.now() - olderThanMinutes * 60000);

    const orphaned = await prisma.message.findMany({
        where: {
            type: "THINKING",
            createAt: { lt: cutoffTime }
        },
        select: {
            id: true,
            projectId: true,
            createAt: true,
            thinking: true
        },
        orderBy: {
            createAt: 'asc'
        }
    });

    return orphaned.map(msg => ({
        id: msg.id,
        projectId: msg.projectId,
        age: Math.floor((Date.now() - msg.createAt.getTime()) / 60000), // Age in minutes
        createdAt: msg.createAt,
        steps: isThinkingData(msg.thinking) ? msg.thinking.steps.length : 0
    }));
}
