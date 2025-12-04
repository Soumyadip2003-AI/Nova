import { z } from 'zod';
import { inngest } from "./client";
import {  openai, createAgent, createTool, createNetwork, type Tool } from "@inngest/agent-kit";
import { Sandbox} from "@e2b/code-interpreter"
import { getSandbox, lastAssistantTextMessageContent } from "./utils";
import { PROMPT } from '@/prompt';
import { prisma } from '@/lib/db';
import {
  createThinkingMessage,
  addThinkingStep,
  completeCurrentThinkingStep,
  deleteThinkingMessage,
  cleanupThinkingMessageWithError
} from '@/lib/thinking-helpers';

interface AgentState{
  summary:string;
  files:{[path:string]:string};
};



export const codeAgentFunction = inngest.createFunction(
  {
    id: "code-agent",
    onFailure: async ({ error, event, step }) => {
      console.log("onFailure triggered:", error);

      // Clean up thinking message on cancellation or failure
      await step.run("cleanup-on-failure", async () => {
        // In onFailure, event structure is nested: event.data.event.data contains original data
        const originalEvent = event.data?.event;
        const projectId = originalEvent?.data?.projectId;

        console.log("Cleaning up after failure:", { projectId, error: error.message });

        if (!projectId) {
          console.error("No projectId found in event data for cleanup");
          return;
        }

        // Determine appropriate error message based on error type
        const errorMessage = error.message?.includes("cancel") || error.message?.includes("Cancel")
          ? "Task was cancelled."
          : "The task encountered an error. Please try again.";

        // Search for the thinking message to clean up
        const thinkingMessages = await prisma.message.findMany({
          where: {
            projectId,
            type: "THINKING"
          },
          orderBy: { createAt: 'desc' },
          take: 1
        });

        if (thinkingMessages.length > 0) {
          await cleanupThinkingMessageWithError(
            thinkingMessages[0].id,
            projectId,
            errorMessage
          );
        } else {
          // Always create error message even if no thinking message found
          console.warn("No thinking message found, creating error message anyway");
          await prisma.message.create({
            data: {
              projectId,
              content: errorMessage,
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
    // Create thinking message to track progress
    const thinkingMessage = await step.run("create-thinking", async () => {
      return await createThinkingMessage(event.data.projectId);
    });

    const sandboxId = await step.run("get-sandbox-id",async ()=>{
      await addThinkingStep(
        thinkingMessage.id,
        "Setting up environment",
        `Creating isolated development environment for: "${event.data.value}"`
      );
      const sandbox= await Sandbox.create("vibe-nextjs-soumyadip-888");
      // Complete immediately after sandbox is created
      await completeCurrentThinkingStep(thinkingMessage.id);
      return sandbox.sandboxId;
    });

    await step.run("start-analysis", async () => {
      await addThinkingStep(
        thinkingMessage.id,
        "Planning implementation",
        `Analyzing how to best implement: "${event.data.value}"`
      );
      await completeCurrentThinkingStep(thinkingMessage.id);
    });

    const codeAgent = createAgent<AgentState>({
      name: "code-agent",
      system: PROMPT,
      description: "An expert coding agent",
      model: openai({
        model: "gpt-5.1",
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
              try{
                const updatedFiles = network.state.data.files ||{};
                const sandbox= await getSandbox(sandboxId);
                for(const file of files){
                  await sandbox.files.write(file.path, file.content);
                  updatedFiles[file.path]= file.content;
                }
                return updatedFiles;

              }catch(e){
                return "Error:" +e;

              }
            });
            if(typeof newFiles === "object"){
              network.state.data.files= newFiles;
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
        onResponse: async ({result,network})=>{
          const lastAssistantMessageText =
          lastAssistantTextMessageContent(result);

          if(lastAssistantMessageText && network){
            if(lastAssistantMessageText.includes("<task_summary")){
              network.state.data.summary = lastAssistantMessageText;
              // Don't complete step here - let the outer flow handle it
              // This allows proper sequencing: Writing code → Preparing preview → Done
            }
          }
          return result;

        },
      }
    });

    const network= createNetwork<AgentState>({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 15,
      router: async ({network}) =>{
        const summary = network.state.data.summary;
        if (summary){
          return;
        }

        return codeAgent;
      },

    });

    try {
      // Add "Writing code" step before agent starts
      await step.run("start-generation", async () => {
        await addThinkingStep(
          thinkingMessage.id,
          "Writing code",
          "Generating clean, production-ready code with GPT-5.1..."
        );
      });

      // Run the agent network - this is the long-running operation
      const result = await network.run(event.data.value);

      // Complete the "Writing code" step after agent finishes
      await step.run("complete-generation", async () => {
        await completeCurrentThinkingStep(thinkingMessage.id);
      });

      const isError =
        !result.state.data.summary ||
        Object.keys(result.state.data.files || {}).length == 0;

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
        // Delete thinking message before creating final result
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
        })
      })

      // summary stop.

      return {
        url: sandboxUrl,
        title: "Fragment",
        files: result.state.data.files,
        summary: result.state.data.summary,

      };
    } catch (error) {
      console.error("Agent execution failed:", error);

      // Delete thinking message on error
      await step.run("cleanup-thinking", async () => {
        try {
          await deleteThinkingMessage(thinkingMessage.id);
        } catch (e) {
          console.error("Failed to delete thinking message:", e);
        }
      });

      await step.run("save-error", async () => {
        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: `An error occurred: ${error instanceof Error ? error.message : "Unknown error"}`,
            role: "ASSISTANT",
            type: "ERROR",
          },
        });
      });
      throw error; // Re-throw to ensure Inngest marks it as failed
    }
  },
);