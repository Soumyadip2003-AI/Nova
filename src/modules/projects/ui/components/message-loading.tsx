import { useState } from "react";
import { CheckIcon, ChevronUp, Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

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

type Tone = "problem" | "check" | undefined;
type Line = { text: string; detail: boolean; done: boolean; tone?: Tone };

/** Steps the self-check writes: problems it found, and the passing check. */
const toneOf = (title: string): Tone =>
    title === "Fixing problems" ? "problem" : title === "Checked" ? "check" : undefined;

/** Every step title and every real action logged under it, in order. */
export function thinkingLines(steps: ThinkingStep[]): Line[] {
    return steps.flatMap((step) => {
        const tone = toneOf(step.title);
        return [
            { text: step.title, detail: false, done: step.completed, tone },
            ...step.content
                .split("\n")
                .map((t) => t.trim())
                .filter(Boolean)
                .map((text) => ({ text, detail: true, done: step.completed, tone })),
        ];
    });
}

/** Round status mark, always paired with a screen-reader word. */
const StepMark = ({ line }: { line: Line }) => {
    if (!line.done) {
        return (
            <span className="mt-0.5 flex size-[18px] shrink-0 items-center justify-center">
                <Loader2Icon
                    className={cn("size-4 animate-spin", line.tone === "problem" ? "text-destructive" : "text-muted-foreground")}
                    aria-hidden
                />
                <span className="sr-only">In progress: </span>
            </span>
        );
    }
    if (line.tone === "problem") {
        return (
            <span className="mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 border-destructive text-destructive">
                <CheckIcon className="size-2.5" strokeWidth={3} aria-hidden />
                <span className="sr-only">Done: </span>
            </span>
        );
    }
    return (
        <span
            className={cn(
                "mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full text-primary-foreground",
                line.tone === "check" ? "bg-success" : "bg-primary",
            )}
        >
            <CheckIcon className="size-3" strokeWidth={3} aria-hidden />
            <span className="sr-only">Done: </span>
        </span>
    );
};

const ThinkingLog = ({ thinking }: { thinking: ThinkingData }) => {
    const [open, setOpen] = useState(false);
    const lines = thinkingLines(thinking.steps);
    const working = thinking.steps.some((s) => !s.completed);
    const shown = open ? lines : lines.slice(-2);
    const hidden = lines.length - shown.length;

    return (
        <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card px-4 py-3.5">
            <div className="flex items-center gap-2">
                <p className="text-[13px] font-medium text-muted-foreground">{working ? "Working on it" : "Finished"}</p>
                {lines.length > 2 && (
                    <button
                        type="button"
                        onClick={() => setOpen((o) => !o)}
                        aria-expanded={open}
                        className="ml-auto flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <span>{open ? "Show fewer" : `Show ${hidden} more`}</span>
                        <ChevronUp className={cn("size-4 transition-transform", !open && "rotate-180")} aria-hidden />
                    </button>
                )}
            </div>
            <ol className="flex flex-col gap-1.5 text-sm" aria-live="polite">
                {shown.map((line, i) => (
                    <li
                        key={lines.length - shown.length + i}
                        className={cn(
                            "flex items-start gap-2.5 break-words",
                            line.tone && "-mx-2.5 rounded-lg px-2.5 py-1.5",
                            line.tone === "problem" && "bg-destructive-soft",
                            line.tone === "check" && "bg-success-soft",
                            line.detail && "pl-[28px] text-[13px] text-muted-foreground",
                            line.detail && line.tone && "pl-[38px]",
                            !line.detail && line.tone && "font-semibold",
                        )}
                    >
                        {!line.detail && <StepMark line={line} />}
                        <span className="min-w-0">{line.text}</span>
                    </li>
                ))}
            </ol>
        </div>
    );
};

const ShimmerMessages = ({ thinking }: { thinking?: ThinkingData | null }) => {
    if (thinking?.steps?.length) return <ThinkingLog thinking={thinking} />;

    return (
        <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-card px-4 py-3.5" role="status">
            <Loader2Icon className="size-4 animate-spin text-muted-foreground" aria-hidden />
            <span className="text-[13px] font-medium text-muted-foreground">Getting started</span>
        </div>
    );
};

export const MessageLoading = ({ thinking }: { thinking?: ThinkingData | null }) => (
    <div className="flex flex-col pb-4">
        <ShimmerMessages thinking={thinking} />
    </div>
);
