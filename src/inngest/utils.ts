
import {Sandbox }from "@e2b/code-interpreter";
import { AgentResult, TextMessage } from "@inngest/agent-kit";


// How long a sandbox stays up after it was last used. Each use during a build
// pushes this out again, so a build that writes, checks and repairs for more
// than E2B's default 5 minutes no longer loses its sandbox halfway
// ("Paused sandbox ... not found"). It also keeps a finished preview up for
// about this long.
const KEEP_ALIVE_MS = 15 * 60 * 1000;

export async function getSandbox ( sandboxId: string) {
    const sandbox = await Sandbox.connect(sandboxId)
    await sandbox.setTimeout(KEEP_ALIVE_MS);
    return sandbox;
};

export function lastAssistantTextMessageContent(result: AgentResult){
    const lastAssistantTextMessageIndex= result.output.findLastIndex(
        (message)=> message.role ==="assistant",
    );

    const message = result.output[lastAssistantTextMessageIndex] as
    | TextMessage
    | undefined;

    return message?.content
    ?typeof message.content === "string"
    ?message.content
    : message.content.map((c)=> c.text).join("")
    :undefined;
};
    
