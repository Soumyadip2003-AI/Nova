import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma";
import { z } from "zod";

// Error types for specific failure scenarios
export enum ThinkingErrorType {
    SANDBOX_SETUP = "SANDBOX_SETUP",
    AGENT_TIMEOUT = "AGENT_TIMEOUT",
    AGENT_ERROR = "AGENT_ERROR",
    CANCELLED = "CANCELLED",
    UNKNOWN = "UNKNOWN"
}

// Error messages mapped to error types
export const ERROR_MESSAGES: Record<ThinkingErrorType, (details?: string) => string> = {
    [ThinkingErrorType.SANDBOX_SETUP]: () =>
        "Failed to set up the development environment. Please try again.",
    [ThinkingErrorType.AGENT_TIMEOUT]: () =>
        "The task took too long to complete. Try breaking it into smaller tasks or simplifying your request.",
    [ThinkingErrorType.AGENT_ERROR]: (details) =>
        details ? `An error occurred: ${details}` : "An error occurred while processing your request. Please try again.",
    [ThinkingErrorType.CANCELLED]: () =>
        "Stopped. This build was cancelled.",
    [ThinkingErrorType.UNKNOWN]: () =>
        "Something went wrong. Please try again."
};

// Zod schemas for runtime validation
export const ThinkingStepSchema = z.object({
    title: z.string().min(1, "Step title cannot be empty"),
    content: z.string(),
    completed: z.boolean(),
    startTime: z.number().optional(), // Timestamp when step started
    endTime: z.number().optional(), // Timestamp when step completed
    isReasoning: z.boolean().optional(), // True if this is actual model reasoning (o1)
    reasoningTokens: z.number().optional() // Number of tokens used for reasoning
});

export const ThinkingDataSchema = z.object({
    steps: z.array(ThinkingStepSchema),
    modelUsed: z.string().optional(), // Track which model is being used
    isReasoningModel: z.boolean().optional() // True if using o1/o1-mini
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
 * Safely parses Prisma JSON field to ThinkingData
 * @param json - Prisma JSON value
 * @returns ThinkingData or null if invalid
 */
function parseThinkingData(json: Prisma.JsonValue | null): ThinkingData {
    if (!json || !isThinkingData(json)) {
        return { steps: [] };
    }
    return json;
}

/**
 * Converts ThinkingData to Prisma-compatible JSON
 */
function toJsonValue(data: ThinkingData): Prisma.InputJsonValue {
    return data as unknown as Prisma.InputJsonValue;
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

    const thinking = parseThinkingData(message.thinking);

    thinking.steps.push({
        title,
        content,
        completed: false,
        startTime: Date.now() // Track when step starts
    });

    return await prisma.message.update({
        where: { id: messageId },
        data: { thinking: toJsonValue(thinking) }
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

    const thinking = parseThinkingData(message.thinking);
    if (!thinking.steps.length) {
        return message;
    }

    // Find the first incomplete step and mark it as completed
    const currentStepIndex = thinking.steps.findIndex(step => !step.completed);
    if (currentStepIndex !== -1) {
        const step = thinking.steps[currentStepIndex];
        step.completed = true;
        step.endTime = Date.now();

        // Log telemetry for step completion
        const duration = step.startTime ? step.endTime - step.startTime : 0;
        console.log(`[Thinking Telemetry] Step completed:`, {
            step: step.title,
            durationMs: duration,
            durationSeconds: (duration / 1000).toFixed(2)
        });
    }

    return await prisma.message.update({
        where: { id: messageId },
        data: { thinking: toJsonValue(thinking) }
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

    const thinking = parseThinkingData(message.thinking);
    if (!thinking.steps.length) {
        return message;
    }

    // Find the current incomplete step and update its content
    const currentStepIndex = thinking.steps.findIndex(step => !step.completed);
    if (currentStepIndex !== -1) {
        thinking.steps[currentStepIndex].content = content;
    }

    return await prisma.message.update({
        where: { id: messageId },
        data: { thinking: toJsonValue(thinking) }
    });
}

/**
 * Adds reasoning content from o1 models to a thinking step
 * This shows the actual thinking process from reasoning models
 * @param messageId - The thinking message ID
 * @param title - Title for the reasoning step
 * @param reasoning - The actual reasoning content from the model
 * @param reasoningTokens - Number of tokens used for reasoning
 */
export async function addReasoningStep(
    messageId: string,
    title: string,
    reasoning: string,
    reasoningTokens?: number
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

    const thinking = parseThinkingData(message.thinking);

    thinking.steps.push({
        title,
        content: reasoning,
        completed: true,
        startTime: Date.now(),
        endTime: Date.now(),
        isReasoning: true,
        reasoningTokens
    });

    return await prisma.message.update({
        where: { id: messageId },
        data: { thinking: toJsonValue(thinking) }
    });
}

/**
 * Updates the thinking message with model metadata
 * @param messageId - The thinking message ID
 * @param modelUsed - The model being used
 * @param isReasoningModel - Whether it's a reasoning model (o1/o1-mini)
 */
export async function setThinkingModelMetadata(
    messageId: string,
    modelUsed: string,
    isReasoningModel: boolean
) {
    const message = await prisma.message.findUnique({
        where: { id: messageId },
    });

    if (!message || message.type !== "THINKING") {
        return null;
    }

    const thinking = parseThinkingData(message.thinking);
    thinking.modelUsed = modelUsed;
    thinking.isReasoningModel = isReasoningModel;

    return await prisma.message.update({
        where: { id: messageId },
        data: { thinking: toJsonValue(thinking) }
    });
}

/**
 * Deletes the thinking message (call this when AI finishes generating)
 * Logs aggregate telemetry before deletion
 * @param messageId - The thinking message ID
 */
export async function deleteThinkingMessage(messageId: string) {
    try {
        // Fetch the message to log telemetry before deletion
        const message = await prisma.message.findUnique({
            where: { id: messageId }
        });

        if (message && message.type === "THINKING") {
            const thinking = parseThinkingData(message.thinking);
            if (thinking.steps.length > 0) {
                // Calculate aggregate metrics
                const totalDuration = thinking.steps.reduce((acc, step) => {
                    if (step.startTime && step.endTime) {
                        return acc + (step.endTime - step.startTime);
                    }
                    return acc;
                }, 0);

                const completedSteps = thinking.steps.filter(s => s.completed).length;
                const stepMetrics = thinking.steps.map(step => ({
                    step: step.title,
                    completed: step.completed,
                    durationMs: step.startTime && step.endTime ? step.endTime - step.startTime : null
                }));

                console.log(`[Thinking Telemetry] Process completed:`, {
                    messageId,
                    totalSteps: thinking.steps.length,
                    completedSteps,
                    totalDurationMs: totalDuration,
                    totalDurationSeconds: (totalDuration / 1000).toFixed(2),
                    stepBreakdown: stepMetrics
                });
            }
        }

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
 * @param errorType - The type of error that occurred
 * @param errorDetails - Optional additional details about the error
 * @returns Object with success status and any error
 */
export async function cleanupThinkingMessageWithError(
    messageId: string,
    projectId: string,
    errorType: ThinkingErrorType = ThinkingErrorType.UNKNOWN,
    errorDetails?: string
) {
    try {
        // Fetch the message to log telemetry before deletion
        const message = await prisma.message.findUnique({
            where: { id: messageId }
        });

        // Log telemetry for failed thinking processes
        if (message && message.type === "THINKING") {
            const thinking = parseThinkingData(message.thinking);
            if (thinking.steps.length > 0) {
                const completedSteps = thinking.steps.filter(s => s.completed);
                const currentStep = thinking.steps.find(s => !s.completed);
                const totalDuration = thinking.steps.reduce((acc, step) => {
                    if (step.startTime && step.endTime) {
                        return acc + (step.endTime - step.startTime);
                    }
                    return acc;
                }, 0);

                console.log(`[Thinking Telemetry] Process failed:`, {
                    messageId,
                    errorType,
                    errorDetails,
                    totalSteps: thinking.steps.length,
                    completedSteps: completedSteps.length,
                    failedAtStep: currentStep?.title,
                    totalDurationMs: totalDuration,
                    stepBreakdown: thinking.steps.map(step => ({
                        step: step.title,
                        completed: step.completed,
                        durationMs: step.startTime && step.endTime ? step.endTime - step.startTime : null
                    }))
                });
            }
        }

        // Get the appropriate error message for the error type
        const errorMessage = ERROR_MESSAGES[errorType](errorDetails);

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

        return { success: true, messageId, projectId, errorType };
    } catch (error) {
        console.error(`Failed to cleanup thinking message ${messageId}:`, error);

        // Try to at least create the error message for user feedback
        try {
            const errorMessage = ERROR_MESSAGES[errorType](errorDetails);
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

        return { success: false, error, messageId, projectId, errorType };
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
                createdAt: { gte: fiveMinutesAgo }
            }
        }),
        // Stale thinking messages (5-60 minutes old)
        prisma.message.count({
            where: {
                type: "THINKING",
                createdAt: {
                    gte: oneHourAgo,
                    lt: fiveMinutesAgo
                }
            }
        }),
        // Very old thinking messages (> 1 hour - should be cleaned up)
        prisma.message.count({
            where: {
                type: "THINKING",
                createdAt: { lt: oneHourAgo }
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
            createdAt: { lt: cutoffTime }
        },
        select: {
            id: true,
            projectId: true,
            createdAt: true,
            thinking: true
        },
        orderBy: {
            createdAt: 'asc'
        }
    });

    return orphaned.map(msg => ({
        id: msg.id,
        projectId: msg.projectId,
        age: Math.floor((Date.now() - msg.createdAt.getTime()) / 60000), // Age in minutes
        createdAt: msg.createdAt,
        steps: isThinkingData(msg.thinking) ? msg.thinking.steps.length : 0
    }));
}

/**
 * Appends one line describing a real action (a file written, a command run)
 * to the current thinking step, so the user sees what the agent actually did.
 */
export async function appendThinkingLog(messageId: string, line: string) {
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message || message.type !== "THINKING") return;

    const thinking = parseThinkingData(message.thinking);
    const current = thinking.steps.find(step => !step.completed);
    if (!current) return;
    current.content = current.content ? `${current.content}\n${line}` : line;

    await prisma.message.update({
        where: { id: messageId },
        data: { thinking: toJsonValue(thinking) }
    });
}
