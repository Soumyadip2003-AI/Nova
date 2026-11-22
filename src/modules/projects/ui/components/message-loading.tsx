import { useState } from "react";
import { Brain, Check, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";

export interface ThinkingStep {
    title: string;
    content: string;
    completed: boolean;
    isReasoning?: boolean;
    reasoningTokens?: number;
}

export interface ThinkingData {
    steps: ThinkingStep[];
    modelUsed?: string;
    isReasoningModel?: boolean;
}

type Line = { text: string; detail: boolean; done: boolean };

/** Every step title and every real action logged under it, in order. */
export function thinkingLines(steps: ThinkingStep[]): Line[] {
    return steps.flatMap((step) => [
        { text: step.title, detail: false, done: step.completed },
        ...step.content
            .split("\n")
            .map((t) => t.trim())
            .filter(Boolean)
            .map((text) => ({ text, detail: true, done: step.completed })),
    ]);
}

const TypingIndicator = () => (
    <div className="flex items-center gap-1" aria-hidden>
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
    </div>
);

const ThinkingLog = ({ thinking }: { thinking: ThinkingData }) => {
    const [open, setOpen] = useState(false);
    const lines = thinkingLines(thinking.steps);
    const working = thinking.steps.some((s) => !s.completed);
    const shown = open ? lines : lines.slice(-2);
    const hidden = lines.length - shown.length;

    return (
        <div className="flex flex-col gap-2 p-4 rounded-2xl border bg-muted/40">
            <div className="flex items-center gap-2">
                {working ? <Brain className="w-4 h-4 text-primary" aria-hidden /> : <Check className="w-4 h-4 text-primary" aria-hidden />}
                <span className="text-sm font-semibold">{working ? "Thinking" : "Done"}</span>
                {working && <TypingIndicator />}
                {lines.length > 2 && (
                    <button
                        type="button"
                        onClick={() => setOpen((o) => !o)}
                        aria-expanded={open}
                        aria-label={open ? "Show only the latest steps" : `Show all ${lines.length} steps`}
                        className="ml-auto flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                    >
                        {!open && hidden > 0 && <span>{hidden} more</span>}
                        <ChevronUp className={cn("h-4 w-4 transition-transform", !open && "rotate-180")} aria-hidden />
                    </button>
                )}
            </div>
            <ol className="flex flex-col gap-1 text-xs" aria-live="polite">
                {shown.map((line, i) => (
                    <li
                        key={lines.length - shown.length + i}
                        className={cn(
                            "break-words",
                            line.detail ? "pl-6 font-mono text-muted-foreground" : "flex items-center gap-2 font-medium",
                        )}
                    >
                        {!line.detail && (
                            <span className="w-4 shrink-0 text-center" aria-label={line.done ? "done" : "in progress"}>
                                {line.done ? "✓" : "…"}
                            </span>
                        )}
                        {line.text}
                    </li>
                ))}
            </ol>
        </div>
    );
};

const ShimmerMessages = ({ thinking }: { thinking?: ThinkingData | null }) => {
    if (thinking?.steps?.length) return <ThinkingLog thinking={thinking} />;

    return (
        <div className="flex items-center gap-2 p-4 rounded-2xl border bg-muted/40">
            <Brain className="w-4 h-4 text-primary" aria-hidden />
            <span className="text-sm font-semibold">Thinking</span>
            <TypingIndicator />
        </div>
    );
};

export const MessageLoading = ({ thinking }: { thinking?: ThinkingData | null }) => (
    <div className="flex flex-col group px-2 pb-4">
        <div className="flex items-center gap-2 pl-2 mb-3">
            <Logo size={20} showText pulse />
        </div>
        <div className="pl-8 flex flex-col gap-y-4">
            <ShimmerMessages thinking={thinking} />
        </div>
    </div>
);
