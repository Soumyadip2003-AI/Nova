import { z } from 'zod';
import { inngest } from "./client";
import {  openai, createAgent, createTool, createNetwork, createState, type Tool } from "@inngest/agent-kit";
import { Sandbox} from "@e2b/code-interpreter"
import { getSandbox, lastAssistantTextMessageContent } from "./utils";
import { PROMPT, RESPONSE_PROMPT, FRAGMENT_TITLE_PROMPT } from '@/prompt';
import { prisma } from '@/lib/db';
import {
  createThinkingMessage,
  addThinkingStep,
  completeCurrentThinkingStep,
  deleteThinkingMessage,
  cleanupThinkingMessageWithError,
  ThinkingErrorType,
  addReasoningStep,
  setThinkingModelMetadata
} from '@/lib/thinking-helpers';

interface AgentState{
  summary:string;
  files:{[path:string]:string};
};



export const codeAgentFunction = inngest.createFunction(
  {
    id: "code-agent",
    cancelOn: [
      {
        event: "code-agent/cancel",
        match: "data.projectId",
      },
    ],
    onFailure: async ({ error, event, step }) => {
      console.log("onFailure triggered:", error);

      // Clean up thinking message on cancellation or failure
      await step.run("cleanup-on-failure", async () => {
        // In onFailure, event structure is nested: event.data.event.data contains original data
        const originalEvent = event.data?.event;
        const projectId = originalEvent?.data?.projectId;
        const userId = originalEvent?.data?.userId;

        console.log("Cleaning up after failure:", { projectId, userId, error: error.message });

        if (!projectId) {
          console.error("No projectId found in event data for cleanup");
          return;
        }

        // Refund credits if they were consumed before the failure
        if (userId) {
          try {
            const { refundCreditsForUser } = await import("@/lib/usage");
            await refundCreditsForUser(userId);
            console.log("✓ Credits refunded after generation failure");
          } catch (refundError) {
            console.error("✗ Failed to refund credits after generation failure:", refundError);
            // Continue with cleanup even if refund fails
          }
        }

        // Determine appropriate error type based on error message
        const errorType = error.message?.includes("cancel") || error.message?.includes("Cancel")
          ? ThinkingErrorType.CANCELLED
          : ThinkingErrorType.AGENT_ERROR;

        // Search for the thinking message to clean up
        const thinkingMessages = await prisma.message.findMany({
          where: {
            projectId,
            type: "THINKING"
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        });

        if (thinkingMessages.length > 0) {
          await cleanupThinkingMessageWithError(
            thinkingMessages[0].id,
            projectId,
            errorType,
            error.message
          );
        } else {
          // Always create error message even if no thinking message found
          console.warn("No thinking message found, creating error message anyway");
          const { ERROR_MESSAGES } = await import('@/lib/thinking-helpers');
          await prisma.message.create({
            data: {
              projectId,
              content: ERROR_MESSAGES[errorType](error.message),
              role: "ASSISTANT",
              type: "ERROR",
            },
          });
        }
      });
    }
  },
  { event: "code-agent/run" },
  async ({ event , step}) => {
    // Get the selected model from event data (defaults to gpt-4o-mini for safety)
    const selectedModel = event.data.model || "gpt-4o-mini";

    // Check if this is a reasoning model (o1 family)
    const { isReasoningModel } = await import("@/lib/models");
    const useReasoningModel = isReasoningModel(selectedModel);

    // Create thinking message to track progress
    const thinkingMessage = await step.run("create-thinking", async () => {
      const msg = await createThinkingMessage(event.data.projectId);
      // Set model metadata so UI knows what type of model is being used
      await setThinkingModelMetadata(msg.id, selectedModel, useReasoningModel);
      return msg;
    });

    // CRITICAL: Consume credits BEFORE starting expensive generation
    // This prevents free generations if credit consumption fails later
    // Credits will be refunded via onFailure handler if generation fails
    await step.run("consume-credits", async () => {
      const { consumeCreditsForUser } = await import("@/lib/usage");
      try {
        await consumeCreditsForUser(event.data.userId);
        console.log("✓ Credits consumed upfront before generation");
      } catch (error) {
        console.error("✗ Failed to consume credits before generation:", error);
        throw new Error("Failed to consume credits. Please try again.");
      }
    });

    // Get project name for later use
    const projectName = await step.run("get-project-name", async () => {
      const project = await prisma.project.findUnique({
        where: { id: event.data.projectId },
        select: { name: true },
      });
      return project?.name || "Fragment";
    });

    const sandboxId = await step.run("get-sandbox-id",async ()=>{
      try {
        await addThinkingStep(
          thinkingMessage.id,
          "Setting up environment",
          `Creating isolated development environment for: "${event.data.value}"`
        );

        // Check if user is Pro to set appropriate sandbox timeout
        const { getUsageStatusForUser } = await import("@/lib/usage");
        const usageStatus = await getUsageStatusForUser(event.data.userId);
        const isPro = usageStatus.plan === "PRO";

        // Use template ID (more reliable) or fall back to template name
        const templateId = process.env.E2B_TEMPLATE_ID || "c7kxk6kebmrc9xzxb09f";

        // Pro users get 20 minutes (1200000ms), Free users get default timeout
        if (isPro) {
          console.log("✨ Pro user detected - setting 20 minute sandbox timeout");
        }
        const sandbox = isPro
          ? await Sandbox.create(templateId, { timeoutMs: 1200000 })
          : await Sandbox.create(templateId);

        // Load existing files from previous project state
        const existingProject = await prisma.message.findFirst({
          where: {
            projectId: event.data.projectId,
            type: "RESULT",
            fragment: { isNot: null },
          },
          orderBy: { createdAt: "desc" },
          include: { fragment: true },
        });

        // If there are existing files, load them into the sandbox
        if (existingProject?.fragment?.files) {
          const files = existingProject.fragment.files as Record<string, string>;
          for (const [path, content] of Object.entries(files)) {
            await sandbox.files.write(path, content);
          }
        }

        // Complete immediately after sandbox is created
        await completeCurrentThinkingStep(thinkingMessage.id);
        return sandbox.sandboxId;
      } catch (error) {
        // Cleanup with specific sandbox error type
        await cleanupThinkingMessageWithError(
          thinkingMessage.id,
          event.data.projectId,
          ThinkingErrorType.SANDBOX_SETUP,
          error instanceof Error ? error.message : undefined
        );
        throw error; // Re-throw to stop execution
      }
    });

    await step.run("start-analysis", async () => {
      await addThinkingStep(
        thinkingMessage.id,
        "Planning implementation",
        `Analyzing how to best implement: "${event.data.value}"`
      );
      await completeCurrentThinkingStep(thinkingMessage.id);
    });

    // Track iteration count for progress updates
    let iterationCount = 0;
    const maxIterations = 30;

    const codeAgent = createAgent<AgentState>({
      name: "code-agent",
      system: PROMPT,
      description: "An expert coding agent",
      model: openai({
        model: selectedModel,
        defaultParameters:{
          temperature: 0.1,
        }
      }),
      tools:[
        createTool({
          name: "terminal",
          description: "use the terminal to run commands",
          parameters: z.object({
            command: z.string(),
          }),
          handler: async ({command},{step})=>{
            return await step?.run("terminal", async()=> {
              const buffers ={stdout: "", stderr: ""};
              try{
                const sandbox= await getSandbox(sandboxId);
                const result= await sandbox.commands.run(command ,{
                 onStdout: (data: string) =>{
                  buffers.stdout+= data;
                 },
                 onStderr: (data: string)=>{
                  buffers.stderr+=data;
                 }
                });

                return result.stdout;

              }catch(e){
                console.error(
                  `Command failed: ${e} \nstdout: ${buffers.stdout}\nstderror: ${buffers.stderr}`,

                );
                return `Command failed: ${e} \nstdout: ${buffers.stdout}\nstderror: ${buffers.stderr}`;


              }
            });
          },
        }),
        createTool({
          name:"createOrUpdateFiles",
          description:"Create or Update files in the sandbox",
          parameters: z.object({
            files:z.array(
              z.object({
                path:z.string(),
                content:z.string(),
              }),
            ),
          }),
          handler: async(
            {files} ,
            {step, network}:Tool.Options<AgentState>
          )=>{
            const newFiles = await step?.run ("createOrUpdateFiles", async() => {
              const updatedFiles = network.state.data.files ||{};
              const sandbox= await getSandbox(sandboxId);
              for(const file of files){
                await sandbox.files.write(file.path, file.content);
                updatedFiles[file.path]= file.content;
              }
              return updatedFiles;
            });
            // Always update state with the new files object (with fallback for safety)
            if (newFiles) {
              network.state.data.files = newFiles;
            }
          }
        }),
        createTool({
          name:"readFiles",
          description: "Read files from the sandbox",
          parameters:z.object({
            files:z.array(z.string()),
          }),
          handler: async({files},{step})=> {
            return await step?.run("readFiles", async() => {
              try{
                const sandbox= await getSandbox(sandboxId);
                const contents =[];
                for(const file of files){
                  const content=await sandbox .files.read(file);
                  contents.push({path: file, content});
                }
                
                
                return JSON.stringify(contents);
              }catch(e){
                return "Error:" + e;
              }
            });
          },
        })
      ],
      lifecycle:{
        onResponse: async ({result, network}) => {
          iterationCount++;
          const lastAssistantMessageText = lastAssistantTextMessageContent(result);

          // Update thinking message with progress
          try {
            const { updateCurrentThinkingStepContent } = await import('@/lib/thinking-helpers');
            const progress = Math.min(Math.round((iterationCount / maxIterations) * 100), 95);

            if (useReasoningModel) {
              // For reasoning models, show reasoning progress
              await updateCurrentThinkingStepContent(
                thinkingMessage.id,
                `Reasoning through the problem... (${progress}% - iteration ${iterationCount})`
              );
            } else {
              // For standard models, show what's happening
              const filesCreated = network ? Object.keys(network.state.data.files || {}).length : 0;
              await updateCurrentThinkingStepContent(
                thinkingMessage.id,
                `Writing code... ${filesCreated > 0 ? `Created ${filesCreated} file${filesCreated > 1 ? 's' : ''}` : 'Analyzing requirements'} (${progress}%)`
              );
            }
          } catch (e) {
            // Don't fail if update fails
            console.log("Could not update thinking step:", e);
          }

          if (lastAssistantMessageText && network) {
            if (lastAssistantMessageText.includes("<task_summary")) {
              network.state.data.summary = lastAssistantMessageText;
            }
          }
          return result;
        },
      }
    });

    const network= createNetwork<AgentState>({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 30, // Increased from 15 to allow more complex generations
      defaultState: createState<AgentState>({
        summary: "",
        files: {},
      }),
      router: async ({network}) =>{
        const summary = network.state.data.summary;
        if (summary){
          return;
        }

        return codeAgent;
      },

    });

    try {
      // Add thinking step before agent starts - different messaging for reasoning models
      await step.run("start-generation", async () => {
        const { getModelInfo } = await import("@/lib/models");
        const modelInfo = getModelInfo(selectedModel);
        const modelName = modelInfo?.name || selectedModel;

        if (useReasoningModel) {
          // For o1 models, show that the model is reasoning through the problem
          await addThinkingStep(
            thinkingMessage.id,
            "Reasoning",
            `${modelName} is analyzing and reasoning through your request. This model thinks step-by-step before generating code...`
          );
        } else {
          await addThinkingStep(
            thinkingMessage.id,
            "Writing code",
            `Generating clean, production-ready code with ${modelName}...`
          );
        }
      });

      // Run the agent network - this is the long-running operation
      console.log("Starting agent network run with input:", event.data.value.substring(0, 100));
      const result = await network.run(event.data.value);

      // Complete the thinking/reasoning step and add reasoning details for o1 models
      await step.run("complete-generation", async () => {
        await completeCurrentThinkingStep(thinkingMessage.id);

        // For reasoning models, add a step showing the reasoning was completed
        if (useReasoningModel) {
          // Try to extract reasoning summary from the task_summary if available
          const taskSummary = result.state.data.summary || '';
          const reasoningSummary = taskSummary
            ? `The model analyzed your request and determined the best approach. Key decisions made during reasoning are reflected in the generated code.`
            : `Reasoning complete. The model has thought through the problem and generated a solution.`;

          await addReasoningStep(
            thinkingMessage.id,
            "Reasoning Complete",
            reasoningSummary
          );
        }
      });

      // Log the result for debugging
      console.log("Agent result (full state):", JSON.stringify({
        stateData: result.state.data,
        stateDataFiles: result.state.data?.files,
        stateDataSummary: result.state.data?.summary,
        hasStateData: !!result.state.data,
      }, null, 2));
      console.log("Agent result:", {
        hasFiles: Object.keys(result.state.data.files || {}).length,
        hasSummary: !!result.state.data.summary,
        files: Object.keys(result.state.data.files || {}),
      });

      // Consider it an error only if NO files were created
      // (Summary is optional - we'll generate a fallback if needed)
      const files = result.state.data.files || {};
      const hasFiles = Object.keys(files).length > 0;
      const isError = !hasFiles;

      console.log("=== FILE CHECK ===");
      console.log("isError:", isError);
      console.log("hasFiles:", hasFiles);
      console.log("files object:", files);
      console.log("file count:", Object.keys(files).length);
      console.log("file paths:", Object.keys(files));
      console.log("=================");

      const sandboxUrl = await step.run("get-sandbox-url", async () => {
        await addThinkingStep(
          thinkingMessage.id,
          "Preparing preview",
          "Setting up live preview environment and running the application..."
        );

        const sandbox = await getSandbox(sandboxId);
        const host = sandbox.getHost(3000);

        await completeCurrentThinkingStep(thinkingMessage.id);
        return `https://${host}`;
      });

      await step.run("save-result", async () => {
        try {
          console.log("=== SAVE-RESULT STEP START ===");
          console.log("isError:", isError);
          console.log("files count:", Object.keys(files).length);
          console.log("sandboxUrl:", sandboxUrl);

          // Delete thinking message before creating final result
          await deleteThinkingMessage(thinkingMessage.id);
          console.log("Thinking message deleted");

          if (isError) {
            console.log("Creating ERROR message - no files were generated");
            // Credits already consumed - will be refunded by onFailure handler
            throw new Error("Code generation failed - no files were created");
          }

          // Credits were already consumed upfront before generation started
          console.log("✓ Credits already consumed - generation successful");

          // Process the task summary to generate user-friendly content
          const taskSummary = result.state.data.summary;
          let userFriendlySummary: string;
          let fragmentTitle: string;

          if (!taskSummary) {
            // No task summary - generate basic fallback
            const fileCount = Object.keys(files).length;
            const fileList = Object.keys(files).slice(0, 5).join(", ");
            userFriendlySummary = `Successfully generated ${fileCount} file${fileCount !== 1 ? 's' : ''} including: ${fileList}${fileCount > 5 ? ', and more' : ''}.`;
            fragmentTitle = projectName;
            console.log("Generated fallback summary (no AI summary)");
          } else {
            // We have a task summary - use AI to generate better user-facing content
            console.log("Using AI to generate user-friendly summary and title from task_summary");

            try {
              // Use OpenAI directly via the SDK to generate user-friendly content
              const { OpenAI } = await import('openai');
              const openaiClient = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
              });

              // Generate user-friendly summary using RESPONSE_PROMPT
              const summaryCompletion = await openaiClient.chat.completions.create({
                model: "gpt-4o-mini",
                temperature: 0.7,
                messages: [
                  { role: "system", content: RESPONSE_PROMPT },
                  { role: "user", content: taskSummary }
                ],
              });

              // Generate fragment title using FRAGMENT_TITLE_PROMPT
              const titleCompletion = await openaiClient.chat.completions.create({
                model: "gpt-4o-mini",
                temperature: 0.5,
                messages: [
                  { role: "system", content: FRAGMENT_TITLE_PROMPT },
                  { role: "user", content: taskSummary }
                ],
              });

              userFriendlySummary = summaryCompletion.choices[0]?.message?.content?.trim() || taskSummary.replace(/<task_summary[^>]*>/g, '').replace(/<\/task_summary>/g, '').trim();
              fragmentTitle = titleCompletion.choices[0]?.message?.content?.trim() || projectName;

              console.log("✓ Generated user-friendly summary:", userFriendlySummary);
              console.log("✓ Generated fragment title:", fragmentTitle);
            } catch (error) {
              console.error("Failed to generate AI summaries, using fallback:", error);
              userFriendlySummary = taskSummary.replace(/<task_summary[^>]*>/g, '').replace(/<\/task_summary>/g, '').trim();
              fragmentTitle = projectName;
            }
          }

          console.log("Creating SUCCESS message with", Object.keys(files).length, "files");
          console.log("Files to save:", Object.keys(files));

          const message = await prisma.message.create({
            data: {
              projectId: event.data.projectId,
              content: userFriendlySummary,
              role: "ASSISTANT",
              type: "RESULT",
              fragment: {
                create: {
                  sandboxUrl: sandboxUrl,
                  title: fragmentTitle,
                  files: files,
                },
              }
            }
          });

          console.log("✓ SUCCESS message created with ID:", message.id);
          console.log("=== SAVE-RESULT STEP END ===");
          return message;
        } catch (error) {
          console.error("!!! ERROR in save-result step:", error);
          console.error("Error stack:", error instanceof Error ? error.stack : "no stack");
          throw error;
        }
      })

      // summary stop.

      return {
        url: sandboxUrl,
        title: projectName,
        files: files,
        summary: result.state.data.summary,

      };
    } catch (error) {
      console.error("Agent execution failed:", error);

      // Refund credits since generation failed
      await step.run("refund-credits", async () => {
        try {
          const { refundCreditsForUser } = await import("@/lib/usage");
          await refundCreditsForUser(event.data.userId);
          console.log("✓ Credits refunded after generation failure");
        } catch (refundError) {
          console.error("✗ Failed to refund credits:", refundError);
          // Continue with cleanup even if refund fails
        }
      });

      // Delete thinking message on error
      await step.run("cleanup-thinking", async () => {
        try {
          await deleteThinkingMessage(thinkingMessage.id);
        } catch (e) {
          console.error("Failed to delete thinking message:", e);
        }
      });

      await step.run("save-error", async () => {
        const { ERROR_MESSAGES } = await import('@/lib/thinking-helpers');
        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: ERROR_MESSAGES[ThinkingErrorType.AGENT_ERROR](
              error instanceof Error ? error.message : "Unknown error"
            ),
            role: "ASSISTANT",
            type: "ERROR",
          },
        });
      });
      throw error; // Re-throw to ensure Inngest marks it as failed and triggers onFailure
    }
  },
);