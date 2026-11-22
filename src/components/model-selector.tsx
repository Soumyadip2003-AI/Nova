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
import { useEffect, useState } from "react";
import { AI_MODELS, DEFAULT_EFFORT, EFFORTS, EFFORT_LABELS, supportsEffort, type Effort, type ModelId, type ModelInfo } from "@/lib/models";
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
            <span className="flex items-center gap-1 rounded-full bg-accent px-1.5 py-px text-[11px] font-bold text-accent-foreground">
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
  const flagshipModels = availableModels.filter(m => m.category === "flagship");

  // Get current model info for display
  const currentModel = AI_MODELS[value as ModelId];

  return (
    // Inside a <form>, Radix's hidden native select can report "" (e.g. on
    // autofill or reset), which blanked the label; an empty choice is never valid.
    <Select value={value} onValueChange={(next) => next && onChange(next)} disabled={disabled}>
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
        <SelectValue placeholder={<span className="flex items-center gap-1.5">
            {currentModel && MODEL_ICONS[currentModel.category]}
            <span>{currentModel?.name || "Choose a model"}</span>
          </span>}>
          <span className="flex items-center gap-1.5">
            {currentModel && MODEL_ICONS[currentModel.category]}
            <span>{currentModel?.name || "Select model"}</span>
            {currentModel?.tier === "pro" && (
              <span className="rounded-full bg-accent px-1.5 text-[11px] font-bold text-accent-foreground">Pro</span>
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

const EFFORT_KEY = "nova-effort";

/** The chosen effort, remembered in this browser so it carries from home to a project. */
export function useEffort() {
  const [effort, setEffort] = useState<Effort>(DEFAULT_EFFORT);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(EFFORT_KEY);
      if (saved && (EFFORTS as readonly string[]).includes(saved)) setEffort(saved as Effort);
    } catch {}
  }, []);
  const choose = (next: Effort) => {
    setEffort(next);
    try { localStorage.setItem(EFFORT_KEY, next); } catch {}
  };
  return [effort, choose] as const;
}

/** How hard the model thinks. Shown only for models that accept a choice. */
export const EffortSelector = ({ model, value, onChange, disabled }: {
  model: string;
  value: Effort;
  onChange: (value: Effort) => void;
  disabled?: boolean;
}) => {
  if (!supportsEffort(model)) return null;
  return (
    <Select value={value} onValueChange={(next) => next && onChange(next as Effort)} disabled={disabled}>
      <SelectTrigger
        aria-label="Effort"
        size="sm"
        className="h-8 gap-1.5 rounded-full border-0 bg-muted px-3 text-[13px] font-medium text-foreground shadow-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      >
        <SelectValue>
          <span className="flex items-center gap-1.5">
            <BrainIcon className="size-3.5" aria-hidden />
            {EFFORT_LABELS[value]} effort
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="start" className="rounded-2xl border border-border">
        <SelectGroup>
          <SelectLabel className={groupLabel}>Higher effort thinks longer and takes more time</SelectLabel>
          {EFFORTS.map((e) => (
            <SelectItem key={e} value={e} className="rounded-xl">{EFFORT_LABELS[e]}</SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
