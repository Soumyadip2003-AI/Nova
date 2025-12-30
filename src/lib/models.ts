export const AI_MODELS = {
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
  "o1-mini": {
    id: "o1-mini",
    name: "o1 Mini",
    description: "Reasoning model for complex logic",
    tier: "pro",
    category: "reasoning",
  },
  "o1": {
    id: "o1",
    name: "o1",
    description: "Advanced reasoning for complex problems",
    tier: "pro",
    category: "reasoning",
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

export const FREE_TIER_MODELS: ModelId[] = ["gpt-4o-mini"];
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
  const model = AI_MODELS[modelId as ModelId];
  return model?.category === "reasoning";
}

/**
 * Get the reasoning model IDs
 */
export const REASONING_MODELS: ModelId[] = ["o1", "o1-mini"];
