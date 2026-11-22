"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { CrownIcon, CpuIcon, BrainIcon, ZapIcon } from "lucide-react";
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
  /** Lets a visible <label htmlFor> name the trigger. */
  id?: string;
}

const MODEL_ICONS: Record<string, React.ReactNode> = {
  standard: <CpuIcon className="size-3.5" aria-hidden />,
  reasoning: <BrainIcon className="size-3.5" aria-hidden />,
  flagship: <ZapIcon className="size-3.5" aria-hidden />,
};

const groupLabel = "flex items-center gap-1.5 text-xs font-medium text-muted-foreground";

export const ModelSelector = ({ value, onChange, disabled, className, id }: Props) => {
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
      <SelectItem key={model.id} value={model.id} disabled={locked} className="rounded-xl">
        <span className="flex items-center gap-2">
          <span>{model.name}</span>
          {model.tier === "pro" && (
            <span className="flex items-center gap-1 rounded-full bg-accent px-1.5 py-px text-[11px] font-bold text-accent-foreground text-muted-foreground">
              <CrownIcon className="size-3" aria-hidden />
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
        id={id}
        aria-label={id ? undefined : "AI model"}
        size="sm"
        className={cn(
          "h-8 gap-1.5 rounded-full border-0 bg-muted px-3 text-[13px] font-medium text-foreground shadow-none",
          "hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
          className
        )}
      >
        <SelectValue>
          <span className="flex items-center gap-1.5">
            {currentModel && MODEL_ICONS[currentModel.category]}
            <span>{currentModel?.name || "Select model"}</span>
            {currentModel?.tier === "pro" && (
              <span className="font-mono text-[11px] text-muted-foreground">Pro</span>
            )}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="start" className="rounded-2xl border border-border">
        {standardModels.length > 0 && (
          <SelectGroup>
            <SelectLabel className={groupLabel}>
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
              <SelectLabel className={groupLabel}>
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
              <SelectLabel className={groupLabel}>
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
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <CrownIcon className="size-3" aria-hidden />
                Upgrade to Pro to unlock the locked models
              </p>
            </div>
          </>
        )}
      </SelectContent>
    </Select>
  );
};
