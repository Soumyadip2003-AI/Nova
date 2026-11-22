/* Chat Completions <-> Responses translation for the build agent's proxy.
   OpenAI only allows function tools together with a reasoning effort on
   /v1/responses; on /v1/chat/completions it demands reasoning_effort "none",
   which GPT-6.2 Sol and Astra reject. agent-kit 0.13 only speaks Chat
   Completions, so the proxy converts such calls and converts the reply back. */

type Json = Record<string, unknown>;

type ChatToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };
type ChatMessage = {
  role: "system" | "developer" | "user" | "assistant" | "tool";
  content?: string | null;
  tool_calls?: ChatToolCall[];
  tool_call_id?: string;
};

/** A call needs the Responses API when it asks for real reasoning effort. */
export function needsResponsesApi(chat: Json): boolean {
  const effort = chat.reasoning_effort;
  return typeof effort === "string" && effort !== "none";
}

export function chatToResponsesRequest(chat: Json): Json {
  const input: Json[] = [];
  for (const m of (chat.messages as ChatMessage[]) ?? []) {
    if (m.role === "tool") {
      input.push({ type: "function_call_output", call_id: m.tool_call_id, output: m.content ?? "" });
      continue;
    }
    if (m.content) input.push({ role: m.role, content: m.content });
    for (const call of m.tool_calls ?? []) {
      input.push({ type: "function_call", call_id: call.id, name: call.function.name, arguments: call.function.arguments });
    }
  }

  const req: Json = { model: chat.model, input, reasoning: { effort: chat.reasoning_effort }, store: false };
  if (Array.isArray(chat.tools)) {
    req.tools = (chat.tools as { function: Json }[]).map(({ function: f }) => ({
      type: "function",
      name: f.name,
      description: f.description,
      parameters: f.parameters,
      strict: f.strict,
    }));
  }
  const choice = chat.tool_choice as string | { function?: { name: string } } | undefined;
  if (choice !== undefined) {
    req.tool_choice = typeof choice === "string" ? choice : { type: "function", name: choice.function?.name };
  }
  if (chat.parallel_tool_calls !== undefined) req.parallel_tool_calls = chat.parallel_tool_calls;
  const max = chat.max_completion_tokens ?? chat.max_tokens;
  if (max !== undefined) req.max_output_tokens = max;
  return req;
}

type ResponsesOutput =
  | { type: "message"; content?: { type: string; text?: string }[] }
  | { type: "function_call"; call_id: string; name: string; arguments: string }
  | { type: string };

export function responsesToChatResponse(res: Json): Json {
  let text = "";
  const toolCalls: ChatToolCall[] = [];
  for (const item of (res.output as ResponsesOutput[]) ?? []) {
    if (item.type === "message" && "content" in item) {
      text += (item.content ?? []).map((c) => (c.type === "output_text" ? c.text ?? "" : "")).join("");
    } else if (item.type === "function_call" && "call_id" in item) {
      toolCalls.push({ id: item.call_id, type: "function", function: { name: item.name, arguments: item.arguments } });
    }
  }
  const finish = toolCalls.length ? "tool_calls" : res.status === "incomplete" ? "length" : "stop";
  return {
    id: res.id,
    object: "chat.completion",
    model: res.model,
    choices: [{
      index: 0,
      finish_reason: finish,
      message: { role: "assistant", content: text || null, ...(toolCalls.length ? { tool_calls: toolCalls } : {}) },
    }],
    usage: res.usage,
  };
}
