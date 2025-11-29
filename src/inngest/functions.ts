import { inngest } from "./client";
import {  openai, createAgent } from "@inngest/agent-kit";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event}) => {

    const codeAgent = createAgent({
      name: "code-agent",
      system: "You are an expert next.js developer.  You write readable and maintaintable code. you write simple Next.js & react snippts",
      model: openai({ model: "gpt-5.1"  }),
    });

    //transcript step.
       const { output } = await codeAgent.run(` Write the following snippet:${event.data.value}` );
   
   // summary stop.
    
    return { output};
  },
);