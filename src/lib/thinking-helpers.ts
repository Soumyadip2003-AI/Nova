import { prisma } from "@/lib/db";

export interface ThinkingStep {
    title: string;
    content: string;
    completed: boolean;
}

export interface ThinkingData {
    steps: ThinkingStep[];
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

    const thinking = (message.thinking as any as ThinkingData) || { steps: [] };

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
