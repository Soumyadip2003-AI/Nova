export const AI_MODELS = {
  "gpt-6-luna": {
    id: "gpt-6-luna",
    name: "GPT-6 Luna",
    description: "Newest small model, fast and low cost",
    tier: "free",
    category: "standard",
  },
  "gpt-4o-mini": {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    description: "Fast and efficient for most tasks",
    tier: "free",
    category: "standard",
  },
  "gpt-4o": {
    id: "gpt-4o",
    name: "GPT-4o",
    description: "Most capable standard model",
    tier: "pro",
    category: "standard",
  },
  "gpt-4-turbo": {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    description: "High performance with larger context",
    tier: "pro",
    category: "standard",
  },
  "gpt-6.1-terra": {
    id: "gpt-6.1-terra",
    name: "GPT-6.1 Terra",
    description: "Balanced speed and quality",
    tier: "pro",
    category: "standard",
  },
  "gpt-6.2-sol": {
    id: "gpt-6.2-sol",
    name: "GPT-6.2 Sol",
    description: "Strong at multistep tasks",
    tier: "pro",
    category: "flagship",
  },
  "gpt-6.2-astra": {
    id: "gpt-6.2-astra",
    name: "GPT-6.2 Astra",
    description: "Most capable, for complex apps",
    tier: "pro",
    category: "flagship",
  },
  "gpt-5.1": {
    id: "gpt-5.1",
    name: "GPT-5.1",
    description: "Latest flagship model",
    tier: "pro",
    category: "flagship",
  },
} as const;

export type ModelId = keyof typeof AI_MODELS;
export type ModelInfo = (typeof AI_MODELS)[ModelId];

export const DEFAULT_FREE_MODEL: ModelId = "gpt-4o-mini";
export const DEFAULT_PRO_MODEL: ModelId = "gpt-5.1";

export const FREE_TIER_MODELS: ModelId[] = ["gpt-6-luna", "gpt-4o-mini"];
export const PRO_TIER_MODELS: ModelId[] = Object.keys(AI_MODELS) as ModelId[];

export function isModelAvailable(modelId: string, isPro: boolean): boolean {
  if (!AI_MODELS[modelId as ModelId]) return false;
  const model = AI_MODELS[modelId as ModelId];
  return isPro || model.tier === "free";
}

export function getAvailableModels(isPro: boolean): ModelInfo[] {
  return Object.values(AI_MODELS).filter(
    (model) => isPro || model.tier === "free"
  );
}

export function getDefaultModel(isPro: boolean): ModelId {
  return isPro ? DEFAULT_PRO_MODEL : DEFAULT_FREE_MODEL;
}

export function getModelInfo(modelId: string): ModelInfo | undefined {
  return AI_MODELS[modelId as ModelId];
}

/**
 * Check if a model is a reasoning model (o1 family)
 * Reasoning models have special capabilities and show their thinking process
 */
export function isReasoningModel(modelId: string): boolean {
  return (REASONING_MODELS as string[]).includes(modelId);
}

/**
 * Get the reasoning model IDs
 */
// o1 and o1-mini were removed: OpenAI returns "deprecated" / "model_not_found" for them.
export const REASONING_MODELS: ModelId[] = [];

/** Only the GPT-4 family accepts a custom temperature; o1 and GPT-5+ reject it. */
export function supportsTemperature(modelId: string): boolean {
  return modelId.startsWith("gpt-4");
}

/**
 * Extra request parameters for the build agent, per model family.
 * - GPT-4: a low temperature for steady code.
 * - GPT-5 and GPT-6: OpenAI rejects function tools in chat completions unless
 *   reasoning_effort is "none" ("Function tools with reasoning_effort are not
 *   supported ... set reasoning_effort to 'none'"), and the agent needs tools.
 * - o1: no custom temperature, no parallel_tool_calls.
 * parallel_tool_calls: undefined removes the field agent-kit adds, since
 * reasoning models reject it.
 */
export function agentParameters(modelId: string): Record<string, unknown> {
  if (supportsTemperature(modelId)) return { temperature: 0.1 };
  // GPT-6.2 Sol and Astra reject "none" ("Supported values are: 'low',
  // 'medium', 'high', and 'xhigh'"); low is the fastest they accept.
  if (/^gpt-6\.2-/.test(modelId)) return { reasoning_effort: "low", parallel_tool_calls: undefined };
  if (/^gpt-(5|6)/.test(modelId)) return { reasoning_effort: "none", parallel_tool_calls: undefined };
  return { parallel_tool_calls: undefined };
}
