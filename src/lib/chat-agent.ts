/**
 * Chat Agent for answering questions about projects
 * This is a lightweight agent that responds quickly without using Inngest/sandbox
 */

import OpenAI from "openai";
import { prisma } from "@/lib/db";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CHAT_SYSTEM_PROMPT = `You are a friendly and knowledgeable AI assistant for Nova, a code generation platform. Your role is to:

1. **Answer questions** about the code and projects you've helped create
2. **Explain concepts** in a clear, beginner-friendly way
3. **Suggest improvements** and new features users could add
4. **Provide guidance** on how to extend or modify the generated code
5. **Help users understand what they can do** with Nova

## Your Knowledge
- You have access to the files that were created in this project (if any)
- You understand React, Next.js, TypeScript, Tailwind CSS, and Shadcn UI
- You can explain code structure, patterns, and best practices
- You know about Nova's capabilities as an AI code generation platform

## Response Style
- Be conversational and helpful
- Use markdown formatting for code snippets and lists
- Keep explanations clear and concise
- When explaining code, reference specific files and line numbers when relevant
- If suggesting new features, explain HOW they could be implemented

## Important Rules
- Do NOT generate or write new code files - just explain and suggest
- If the user wants to BUILD something new, tell them to describe what they want to create (e.g., "build a calculator" or "make a landing page")
- If there's no code in the project yet, help them understand what Nova can do and encourage them to create something
- Always be encouraging and supportive
- If you don't know something, say so honestly

## When There's No Code Yet
If the user asks about code that doesn't exist yet, politely explain:
- This is a new project with no code yet
- They can ask Nova to build anything by describing it (e.g., "create a calculator", "build a todo app")
- Give examples of what they could build
- Encourage them to start creating

## Format
- Use **bold** for emphasis
- Use \`inline code\` for file names, function names, etc.
- Use code blocks with language tags for code snippets
- Use bullet points for lists
- Keep paragraphs short and readable`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ProjectContext {
  files?: Record<string, string>;
  summary?: string;
  sandboxUrl?: string;
}

/**
 * Get project context (files, summary) for the chat agent
 */
async function getProjectContext(projectId: string): Promise<ProjectContext> {
  // Get the most recent result message with fragment data
  const resultMessage = await prisma.message.findFirst({
    where: {
      projectId,
      type: "RESULT",
    },
    orderBy: { createdAt: "desc" },
    include: {
      fragment: true,
    },
  });

  if (!resultMessage?.fragment) {
    return {};
  }

  return {
    files: resultMessage.fragment.files as Record<string, string> | undefined,
    summary: resultMessage.content ?? undefined,
    sandboxUrl: resultMessage.fragment.sandboxUrl ?? undefined,
  };
}

/**
 * Get conversation history for context
 */
async function getConversationHistory(projectId: string, limit = 10): Promise<ChatMessage[]> {
  const messages = await prisma.message.findMany({
    where: {
      projectId,
      type: { in: ["RESULT", "CHAT"] },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  return messages.map((msg) => ({
    role: msg.role === "USER" ? "user" : "assistant",
    content: msg.content ?? "",
  })) as ChatMessage[];
}

/**
 * Generate a chat response for a question
 */
export async function generateChatResponse(
  projectId: string,
  userMessage: string
): Promise<string> {
  // Get project context
  const context = await getProjectContext(projectId);
  const history = await getConversationHistory(projectId);

  // Build the context message
  let contextMessage = "";

  const hasCode = context.files && Object.keys(context.files).length > 0;

  if (!hasCode) {
    contextMessage += `\n## Project Status\nThis is a new project with no code generated yet. The user hasn't created anything in this project.\n`;
  } else {
    if (context.summary) {
      contextMessage += `\n## Project Summary\n${context.summary}\n`;
    }

    if (context.files && Object.keys(context.files).length > 0) {
      contextMessage += `\n## Project Files\nThis project contains ${Object.keys(context.files).length} files:\n`;
      for (const [path, content] of Object.entries(context.files)) {
        contextMessage += `\n### ${path}\n\`\`\`tsx\n${content}\n\`\`\`\n`;
      }
    }

    if (context.sandboxUrl) {
      contextMessage += `\n## Live Preview\nThe project is running at: ${context.sandboxUrl}\n`;
    }
  }

  // Build messages array
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: CHAT_SYSTEM_PROMPT },
  ];

  // Add context if available
  if (contextMessage) {
    messages.push({
      role: "system",
      content: `Here is the current project context:${contextMessage}`,
    });
  }

  // Add conversation history
  for (const msg of history) {
    messages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  // Add current user message
  messages.push({ role: "user", content: userMessage });

  // Generate response
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini", // Fast and cheap for chat
    messages,
    temperature: 0.7,
    max_tokens: 1500,
  });

  return response.choices[0]?.message?.content ?? "I'm sorry, I couldn't generate a response.";
}

/**
 * Save a chat message to the database
 */
export async function saveChatMessage(
  projectId: string,
  content: string,
  role: "USER" | "ASSISTANT"
): Promise<void> {
  await prisma.message.create({
    data: {
      projectId,
      content,
      role,
      type: "CHAT",
    },
  });
}
