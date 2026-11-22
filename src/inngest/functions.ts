import { z } from 'zod';
import { inngest } from "./client";
import { NonRetriableError } from "inngest";
import { SITE } from "@/lib/site";
import {  openai, createAgent, createTool, createNetwork, createState, type Tool } from "@inngest/agent-kit";
import { Sandbox} from "@e2b/code-interpreter"
import { verifySandbox, repairPrompt, problemFiles, readSandboxFiles } from "./verify";
import { getSandbox, lastAssistantTextMessageContent } from "./utils";
import { buildDesignBrief, promptWithBrief } from "./design-brief";
import { installDependencies, writeProjectAssets } from "@/lib/project-files";
import { attachmentsSchema } from "@/lib/attachments";
/** A command as one readable line for the thinking log. */
const shortCommand = (cmd: string) => {
  const line = cmd.trim().split("\n")[0];
  return `\`${line.length > 80 ? `${line.slice(0, 80)}…` : line}\``;
};

import { PROMPT, RESPONSE_PROMPT, FRAGMENT_TITLE_PROMPT } from '@/prompt';
import { prisma } from '@/lib/db';
import {
  createThinkingMessage,
  addThinkingStep,
  completeCurrentThinkingStep,
  deleteThinkingMessage,
  cleanupThinkingMessageWithError,
  ThinkingErrorType,
  appendThinkingLog,
  setThinkingModelMetadata
} from '@/lib/thinking-helpers';

interface AgentState{
  summary:string;
  files:{[path:string]:string};
  /** Set when the agent installed packages, so package.json is saved with the version. */
  dependenciesChanged?: boolean;
};



// Marker for the consume step's failure, so onFailure knows nothing was charged.
const CONSUME_FAILED = "Failed to consume credits";

export const codeAgentFunction = inngest.createFunction(
  {
    id: "code-agent",
    // One retry, not Inngest's default of several with growing waits: a
    // request the model rejects will not start working, and the user waited
    // 20+ minutes on a spinner before the build was finally reported failed.
    retries: 1,
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

        // Refund only if the credit was actually taken: a failure in the
        // consume step itself means the user was never charged.
        const creditWasTaken = !error.message?.includes(CONSUME_FAILED);
        if (userId && creditWasTaken) {
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
    const { isReasoningModel, agentParameters } = await import("@/lib/models");
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
        // Not retryable: running out of credits will not fix itself.
        throw new NonRetriableError(`${CONSUME_FAILED}. Please try again.`);
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

    // Failures here are retried by Inngest; cleanup and the refund happen once,
    // in onFailure, instead of on every attempt.
    const sandboxId = await step.run("get-sandbox-id",async ()=>{
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
          : await Sandbox.create(templateId, { timeoutMs: 15 * 60 * 1000 });

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
          // A full-stack app saves its package.json; its packages are not in the template.
          await installDependencies(sandbox, files);
        }
        // The user's uploaded images, so the app can use them (/uploads/...).
        await writeProjectAssets(sandbox, event.data.projectId);

        // Complete immediately after sandbox is created
        await completeCurrentThinkingStep(thinkingMessage.id);
        return sandbox.sandboxId;
    });



    const codeAgent = createAgent<AgentState>({
      name: "code-agent",
      system: PROMPT,
      description: "An expert coding agent",
      model: openai({
        model: selectedModel,
        // Through Nova's pass-through so OpenAI's error text is logged.
        baseUrl: `${SITE.url}/api/ai/openai/`,
        // Reasoning-era models (o1, GPT-5 and later) reject a custom temperature.
        // Per-model parameters: GPT-5/6 need reasoning_effort "none" to use tools.
        defaultParameters: agentParameters(selectedModel, event.data.effort),
      }),
      tools:[
        createTool({
          name: "terminal",
          description: "use the terminal to run commands",
          parameters: z.object({
            command: z.string(),
          }),
          handler: async ({command},{step, network})=>{
            // Installing packages changes package.json, which the saved version must then include.
            if (network && /\b(npm (i|install|add)|pnpm add|yarn add)\b/.test(command)) {
              network.state.data.dependenciesChanged = true;
            }
            return await step?.run("terminal", async()=> {
              const buffers ={stdout: "", stderr: ""};
              try{
                const sandbox= await getSandbox(sandboxId);
                const result= await sandbox.commands.run(command ,{
                 // E2B's default is 60s; installing a database driver can take longer.
                 timeoutMs: 180_000,
                 onStdout: (data: string) =>{
                  buffers.stdout+= data;
                 },
                 onStderr: (data: string)=>{
                  buffers.stderr+=data;
                 }
                });

                await appendThinkingLog(thinkingMessage.id, `Ran ${shortCommand(command)}`);
                return result.stdout;

              }catch(e){
                const why = (buffers.stderr || String(e)).trim().split("\n")[0].slice(0, 160);
                await appendThinkingLog(thinkingMessage.id, `Ran ${shortCommand(command)}: failed (${why})`);
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
              await appendThinkingLog(thinkingMessage.id, `Wrote ${files.map((f) => f.path).join(", ")}`);
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
                await appendThinkingLog(thinkingMessage.id, `Read ${files.join(", ")}`);
                
                
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
          const lastAssistantMessageText = lastAssistantTextMessageContent(result);

          // Show what the model said it is doing, in its own words.
          const said = (lastAssistantMessageText || "").replace(/<task_summary>[\s\S]*$/, "").trim();
          const thought = said.split("\n").find((l) => l.trim())?.trim().slice(0, 200);
          if (thought) {
            await step.run("think", () => appendThinkingLog(thinkingMessage.id, thought)).catch(() => {});
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
      // Design references (uploads and links) become a written brief the
      // agent follows. If they cannot be read, the build goes on from the words.
      let agentInput: string = event.data.value;
      const references = attachmentsSchema.safeParse(event.data.attachments ?? []);
      if (references.success && references.data.length) {
        const design = await step.run("study-references", async () => {
          await addThinkingStep(thinkingMessage.id, "Studying your references");
          try {
            const { getUsageStatusForUser } = await import("@/lib/usage");
            const isPro = (await getUsageStatusForUser(event.data.userId)).plan === "PRO";
            return await buildDesignBrief({
              prompt: event.data.value,
              attachments: references.data,
              isPro,
              log: (line) => appendThinkingLog(thinkingMessage.id, line),
            });
          } catch (error) {
            console.error("Design brief failed:", error);
            await appendThinkingLog(thinkingMessage.id, "Could not study the references; building from your description");
            return null;
          } finally {
            await completeCurrentThinkingStep(thinkingMessage.id);
          }
        });
        if (design?.brief) agentInput = promptWithBrief(event.data.value, design);
      }

      // Add thinking step before agent starts - different messaging for reasoning models
      await step.run("start-generation", async () => {
        const { getModelInfo, supportsEffort, EFFORT_LABELS, DEFAULT_EFFORT } = await import("@/lib/models");
        const modelInfo = getModelInfo(selectedModel);
        const effortLabel = EFFORT_LABELS[event.data.effort as keyof typeof EFFORT_LABELS] ?? EFFORT_LABELS[DEFAULT_EFFORT];
        const modelName = (modelInfo?.name || selectedModel) +
          (supportsEffort(selectedModel) ? `, ${effortLabel.toLowerCase()} effort` : "");

        // Starts empty: the real actions (files written, commands run, the
        // model's own words) are appended as they happen.
        await addThinkingStep(thinkingMessage.id, `Working with ${modelName}`);
      });

      // Run the agent network - this is the long-running operation
      console.log("Starting agent network run with input:", event.data.value.substring(0, 100));
      let result = await network.run(agentInput);

      // Self-healing: check the code like a developer would (TypeScript, and
      // the running app's home page) and hand any problems back to the agent,
      // up to MAX_REPAIRS times, before the user ever sees the result.
      const MAX_REPAIRS = 2;
      // Problems still present after the last repair; non-empty means the
      // build could not be fixed, and the user is told and refunded.
      let unfixed: string[] = [];
      // One more check than repairs, so the last repair is verified too.
      // Files Nova wrote in earlier versions of this project are its own code
      // too: a broken file carried over from the last version must be checked
      // and fixed, not filtered out because this run did not touch it.
      const earlierFiles = await step.run("earlier-files", async () => {
        const last = await prisma.fragment.findFirst({
          where: { message: { projectId: event.data.projectId } },
          orderBy: { createdAt: "desc" },
          select: { files: true },
        });
        return Object.keys((last?.files as Record<string, string> | undefined) ?? {});
      });
      for (let attempt = 1; attempt <= MAX_REPAIRS + 1; attempt++) {
        const changed = [...new Set([...Object.keys(result.state.data.files || {}), ...earlierFiles])];
        if (!changed.length) break;
        const check = await step.run(`verify-${attempt}`, () => verifySandbox(sandboxId, changed));
        if (check.ok) {
          await step.run(`verified-${attempt}`, () =>
            addThinkingStep(thinkingMessage.id, "Checked", attempt === 1
              ? "Type check passed and the app loads without errors."
              : `Fixed and re-checked: the app now loads without errors (repair ${attempt - 1}).`));
          await step.run(`verified-done-${attempt}`, () => completeCurrentThinkingStep(thinkingMessage.id));
          break;
        }
        console.log(`Self-healing: ${check.problems.length} problem(s) on check ${attempt}`, check.problems);
        if (attempt > MAX_REPAIRS) {
          unfixed = check.problems;
          await step.run("could-not-fix", () =>
            addThinkingStep(thinkingMessage.id, "Could not fix everything",
              [`${check.problems.length} problem${check.problems.length > 1 ? "s" : ""} left after ${MAX_REPAIRS} repairs:`,
                ...check.problems.slice(0, 5).map((p) => p.slice(0, 200))].join("\n")));
          await step.run("could-not-fix-done", () => completeCurrentThinkingStep(thinkingMessage.id));
          break;
        }
        await step.run(`repairing-${attempt}`, () =>
          addThinkingStep(thinkingMessage.id, "Fixing problems",
            [`Found ${check.problems.length} problem${check.problems.length > 1 ? "s" : ""}, fixing (attempt ${attempt} of ${MAX_REPAIRS}):`,
              ...check.problems.slice(0, 5).map((p) => p.slice(0, 200))].join("\n")));
        const brokenFiles = await step.run(`read-broken-files-${attempt}`, () =>
          readSandboxFiles(sandboxId, problemFiles(check.problems)));
        result.state.data.summary = ""; // lets the router hand control back to the agent
        result = await network.run(repairPrompt(check.problems, brokenFiles), { state: result.state });
        await step.run(`repaired-${attempt}`, () => completeCurrentThinkingStep(thinkingMessage.id));
      }

      // Complete the thinking/reasoning step and add reasoning details for o1 models
      await step.run("complete-generation", async () => {
        await completeCurrentThinkingStep(thinkingMessage.id);

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

      // A version is the whole project: the last version's files plus this
      // run's changes (and package.json when packages were installed). Saving
      // only this run's files dropped everything else from the next build,
      // from restarted previews and from the Code tab.
      const dependenciesChanged = !!result.state.data.dependenciesChanged;
      const projectFiles = await step.run("collect-files", async () => {
        const last = await prisma.fragment.findFirst({
          where: { message: { projectId: event.data.projectId } },
          orderBy: { createdAt: "desc" },
          select: { files: true },
        });
        const merged: Record<string, string> = { ...((last?.files as Record<string, string> | undefined) ?? {}), ...files };
        if (dependenciesChanged) {
          try {
            merged["package.json"] = await (await getSandbox(sandboxId)).files.read("package.json");
          } catch (error) {
            console.error("Could not read package.json:", error);
          }
        }
        return merged;
      });

      const sandboxUrl = await step.run("get-sandbox-url", async () => {
        await addThinkingStep(
          thinkingMessage.id,
          "Preparing preview",
          "Starting your app"
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

          // Never claim success over problems the check still sees.
          if (unfixed.length) {
            userFriendlySummary = [
              `I built this, but ${unfixed.length === 1 ? "one problem is" : `${unfixed.length} problems are`} still there that I could not fix after ${MAX_REPAIRS} tries:`,
              ...unfixed.slice(0, 5).map((p) => `- ${p.slice(0, 200)}`),
              "",
              "Your credit has been returned. Ask me to fix it, or try a different model.",
            ].join("\n");
          }

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
                  files: projectFiles,
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

      // A build the checks could not get working is not charged (see the Terms).
      if (unfixed.length) {
        await step.run("refund-unfixed", async () => {
          const { refundCreditsForUser } = await import("@/lib/usage");
          await refundCreditsForUser(event.data.userId);
        });
      }

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
      // Refund and the error message are done above. Re-throwing would make
      // onFailure refund and report a second time.
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  },
);