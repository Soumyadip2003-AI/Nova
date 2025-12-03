# Integrating Real-Time Thinking Display

This guide shows you how to integrate real-time thinking steps into your Inngest `code-agent` function, similar to ChatGPT o1 or Claude's extended thinking models.

## How It Works

The thinking system displays AI reasoning steps in real-time:

1. When a user sends a message, create a `THINKING` message
2. As your AI agent progresses, add/update thinking steps
3. The UI automatically displays these steps with expand/collapse functionality
4. When the AI finishes, delete the thinking message and create the final response

## Integration Example

Here's how to modify your `functions.ts` file:

```typescript
import {
  createThinkingMessage,
  addThinkingStep,
  completeCurrentThinkingStep,
  deleteThinkingMessage
} from '@/lib/thinking-helpers';

export const codeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },
  async ({ event, step }) => {

    // 1. Create a thinking message at the start
    const thinkingMessage = await step.run("create-thinking", async () => {
      return await createThinkingMessage(event.data.projectId);
    });

    // 2. Add and complete thinking steps as you progress
    await step.run("analyze-request", async () => {
      await addThinkingStep(
        thinkingMessage.id,
        "Analyzing request",
        "Breaking down the user's requirements and understanding the core objective..."
      );
      // Your analysis logic here...
      await completeCurrentThinkingStep(thinkingMessage.id);
    });

    const sandboxId = await step.run("get-sandbox-id", async () => {
      await addThinkingStep(
        thinkingMessage.id,
        "Setting up environment",
        "Initializing development sandbox with necessary dependencies..."
      );
      const sandbox = await Sandbox.create("vibe-nextjs-soumyadip-888");
      await completeCurrentThinkingStep(thinkingMessage.id);
      return sandbox.sandboxId;
    });

    await step.run("planning-implementation", async () => {
      await addThinkingStep(
        thinkingMessage.id,
        "Planning implementation",
        "Determining architecture, components, and code structure..."
      );
      // Your planning logic here...
      await completeCurrentThinkingStep(thinkingMessage.id);
    });

    // Create the agent with thinking updates in lifecycle
    const codeAgent = createAgent<AgentState>({
      name: "code-agent",
      system: PROMPT,
      description: "An expert coding agent",
      model: openai({
        model: "gpt-5.1",
        defaultParameters: {
          temperature: 0.1,
        }
      }),
      tools: [
        // ... your existing tools ...
      ],
      lifecycle: {
        onStart: async () => {
          await addThinkingStep(
            thinkingMessage.id,
            "Generating code",
            "Writing implementation with best practices and design patterns..."
          );
        },
        onToolCall: async ({ tool }) => {
          // Update thinking step based on which tool is being used
          if (tool.name === "terminal") {
            await addThinkingStep(
              thinkingMessage.id,
              "Running commands",
              "Executing necessary build and setup commands..."
            );
          } else if (tool.name === "createOrUpdateFiles") {
            await addThinkingStep(
              thinkingMessage.id,
              "Creating files",
              "Writing code files with proper structure and organization..."
            );
          }
        },
        onResponse: async ({ result, network }) => {
          const lastAssistantMessageText = lastAssistantTextMessageContent(result);

          if (lastAssistantMessageText && network) {
            if (lastAssistantMessageText.includes("<task_summary")) {
              network.state.data.summary = lastAssistantMessageText;
              await completeCurrentThinkingStep(thinkingMessage.id);
            }
          }
          return result;
        },
      }
    });

    const network = createNetwork<AgentState>({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 15,
      router: async ({ network }) => {
        const summary = network.state.data.summary;
        if (summary) {
          return;
        }
        return codeAgent;
      },
    });

    try {
      await addThinkingStep(
        thinkingMessage.id,
        "Executing agent network",
        "Running AI agent to implement your request..."
      );

      const result = await network.run(event.data.value);

      await completeCurrentThinkingStep(thinkingMessage.id);

      const isError =
        !result.state.data.summary ||
        Object.keys(result.state.data.files || {}).length == 0;

      await addThinkingStep(
        thinkingMessage.id,
        "Finalizing output",
        "Preparing sandbox and verifying code quality..."
      );

      const sandboxUrl = await step.run("get-sandbox-url", async () => {
        const sandbox = await getSandbox(sandboxId);
        const host = sandbox.getHost(3000);
        return \`https://\${host}\`;
      });

      await completeCurrentThinkingStep(thinkingMessage.id);

      // 3. Delete thinking message and save final result
      await step.run("save-result", async () => {
        // First delete the thinking message
        await deleteThinkingMessage(thinkingMessage.id);

        if (isError) {
          return await prisma.message.create({
            data: {
              projectId: event.data.projectId,
              content: "Something went wrong. Please try again.",
              role: "ASSISTANT",
              type: "ERROR",
            },
          });
        }

        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: result.state.data.summary,
            role: "ASSISTANT",
            type: "RESULT",
            fragment: {
              create: {
                sandboxUrl: sandboxUrl,
                title: "Fragment",
                files: result.state.data.files,
              },
            }
          }
        });
      });

      return {
        url: sandboxUrl,
        title: "Fragment",
        files: result.state.data.files,
        summary: result.state.data.summary,
      };
    } catch (error) {
      console.error("Agent execution failed:", error);

      // Delete thinking message on error too
      await deleteThinkingMessage(thinkingMessage.id);

      await step.run("save-error", async () => {
        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: \`An error occurred: \${error instanceof Error ? error.message : "Unknown error"}\`,
            role: "ASSISTANT",
            type: "ERROR",
          },
        });
      });
      throw error;
    }
  },
);
```

## Key Points

1. **Create thinking message first**: Call `createThinkingMessage()` at the start
2. **Add steps as you progress**: Use `addThinkingStep()` with descriptive titles and content
3. **Complete steps**: Call `completeCurrentThinkingStep()` when a step finishes
4. **Delete when done**: Call `deleteThinkingMessage()` before creating the final result message
5. **The UI updates automatically**: Your frontend will poll and show thinking steps in real-time

## Customization

You can customize the thinking steps based on your agent's actual workflow. Common examples:

- "Analyzing request" - Understanding user input
- "Planning architecture" - Designing the solution
- "Setting up environment" - Initializing sandbox
- "Generating code" - Creating implementation
- "Running tests" - Executing validation
- "Optimizing output" - Refining the result
- "Finalizing" - Preparing deliverable

The content field can include:
- Detailed reasoning
- Current progress
- Key decisions being made
- Technical considerations

This creates a ChatGPT o1 / Claude extended thinking experience where users can see the AI's reasoning process in real-time!
