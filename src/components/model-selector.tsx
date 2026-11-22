"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { CrownIcon, SparklesIcon, BrainIcon, ZapIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AI_MODELS, type ModelId, type ModelInfo } from "@/lib/models";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

const MODEL_ICONS: Record<string, React.ReactNode> = {
  standard: <SparklesIcon className="size-3.5" />,
  reasoning: <BrainIcon className="size-3.5" />,
  flagship: <ZapIcon className="size-3.5" />,
};

export const ModelSelector = ({ value, onChange, disabled, className }: Props) => {
  const trpc = useTRPC();
  const { isSignedIn } = useAuth();
  // Usage is per user: never ask for it before Clerk confirms a signed-in user.
  const { data: usage } = useQuery({
    ...trpc.usage.status.queryOptions(),
    enabled: isSignedIn === true,
  });

  const isPro = usage?.plan === "PRO";
  // Everyone sees every model; Free users see Pro models locked, so they know
  // what Pro unlocks. The server enforces the same rule.
  const availableModels: ModelInfo[] = Object.values(AI_MODELS);
  const item = (model: ModelInfo) => {
    const locked = !isPro && model.tier === "pro";
    return (
      <SelectItem key={model.id} value={model.id} disabled={locked}>
        <span className="flex items-center gap-2">
          <span>{model.name}</span>
          {model.tier === "pro" && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <CrownIcon className="size-3 text-amber-500" aria-hidden />
              {locked ? "Pro only" : "Pro"}
            </span>
          )}
        </span>
      </SelectItem>
    );
  };

  // Group models by category
  const standardModels = availableModels.filter(m => m.category === "standard");
  const reasoningModels = availableModels.filter(m => m.category === "reasoning");
  const flagshipModels = availableModels.filter(m => m.category === "flagship");

  // Get current model info for display
  const currentModel = AI_MODELS[value as ModelId];

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        size="sm"
        className={cn(
          "h-8 gap-1.5 text-xs bg-white/60 dark:bg-zinc-900/60",
          "border-zinc-200/80 dark:border-zinc-800/80",
          "hover:border-amber-500/40 hover:bg-amber-50/50 dark:hover:bg-amber-950/30",
          className
        )}
      >
        <SelectValue>
          <span className="flex items-center gap-1.5">
            {currentModel && MODEL_ICONS[currentModel.category]}
            <span>{currentModel?.name || "Select model"}</span>
            {currentModel?.tier === "pro" && (
              <CrownIcon className="size-3 text-amber-500" />
            )}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="start">
        {standardModels.length > 0 && (
          <SelectGroup>
            <SelectLabel className="flex items-center gap-1.5 text-xs font-medium">
              {MODEL_ICONS.standard}
              Standard
            </SelectLabel>
            {standardModels.map(item)}
          </SelectGroup>
        )}

        {reasoningModels.length > 0 && (
          <>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel className="flex items-center gap-1.5 text-xs font-medium">
                {MODEL_ICONS.reasoning}
                Reasoning
              </SelectLabel>
              {reasoningModels.map(item)}
            </SelectGroup>
          </>
        )}

        {flagshipModels.length > 0 && (
          <>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel className="flex items-center gap-1.5 text-xs font-medium">
                {MODEL_ICONS.flagship}
                Flagship
              </SelectLabel>
              {flagshipModels.map(item)}
            </SelectGroup>
          </>
        )}

        {!isPro && (
          <>
            <SelectSeparator />
            <div className="px-2 py-1.5">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <CrownIcon className="size-3 text-amber-500" />
                Upgrade to Pro to unlock the locked models
              </p>
            </div>
          </>
        )}
      </SelectContent>
    </Select>
  );
};
