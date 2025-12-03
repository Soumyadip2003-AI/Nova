import Image from "next/image";
import { useState } from "react";
import { ChevronRight } from "lucide-react";

interface ThinkingStep {
    title: string;
    content: string;
    completed: boolean;
}

interface ThinkingData {
    steps: ThinkingStep[];
}

interface ShimmerMessagesProps {
    thinking?: ThinkingData | null;
}

const ShimmerMessages = ({ thinking }: ShimmerMessagesProps) => {
    const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

    const toggleStep = (index: number) => {
        setExpandedSteps((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    // If we have thinking data, show it
    if (thinking && thinking.steps && thinking.steps.length > 0) {
        const currentStepIndex = thinking.steps.findIndex(step => !step.completed);
        const allCompleted = currentStepIndex === -1;
        const hasAnyCompleted = thinking.steps.some(step => step.completed);

        return (
            <div className="flex flex-col gap-3 p-4 rounded-xl border bg-muted/50">
                <div className="flex items-center gap-2.5">
                    {allCompleted ? (
                        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                            <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    ) : (
                        <div className="relative h-5 w-5 shrink-0">
                            <div className="absolute inset-0 rounded-full border-2 border-primary/30" />
                            <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        </div>
                    )}
                    <div className="flex-1">
                        <div className="text-sm font-semibold text-foreground">
                            {allCompleted ? 'Thought complete' : 'Thinking'}
                        </div>
                        {!allCompleted && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                                Processing your request...
                            </div>
                        )}
                    </div>
                </div>

                {hasAnyCompleted && (
                    <div className="space-y-1.5">
                        {thinking.steps.map((step, index) => {
                            const isCurrent = index === currentStepIndex;
                            const isExpanded = expandedSteps.has(index);
                            const isVisible = step.completed || isCurrent;

                            if (!isVisible) return null;

                            return (
                                <div
                                    key={index}
                                    className={`rounded-lg border transition-all ${
                                        isCurrent
                                            ? 'bg-primary/5 border-primary/20'
                                            : 'bg-background border-border hover:border-border/60'
                                    }`}
                                >
                                    <button
                                        onClick={() => step.completed && toggleStep(index)}
                                        className="flex items-start gap-3 text-left w-full p-3 transition-colors"
                                        disabled={!step.completed}
                                    >
                                        <div className="mt-0.5 shrink-0">
                                            {step.completed ? (
                                                <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <svg className="w-2.5 h-2.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            ) : (
                                                <div className="h-4 w-4 rounded-full border-2 border-primary/50 relative">
                                                    <div className="absolute inset-0.5 rounded-full bg-primary/30 animate-pulse" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className={`text-sm font-medium ${
                                                    isCurrent ? 'text-foreground' : 'text-muted-foreground'
                                                }`}>
                                                    {step.title}
                                                </span>
                                                {step.completed && step.content && (
                                                    <ChevronRight
                                                        className={`h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0 ${
                                                            isExpanded ? 'rotate-90' : ''
                                                        }`}
                                                    />
                                                )}
                                            </div>
                                            {isExpanded && step.completed && step.content && (
                                                <div className="text-xs text-muted-foreground/80 mt-2 leading-relaxed whitespace-pre-wrap">
                                                    {step.content}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    // Default loading animation when no thinking data
    return (
        <div className="flex flex-col gap-3 p-4 rounded-xl border bg-muted/50">
            <div className="flex items-center gap-2.5">
                <div className="relative h-5 w-5 shrink-0">
                    <div className="absolute inset-0 rounded-full border-2 border-primary/30" />
                    <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
                <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground">Thinking</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                        Processing your request...
                    </div>
                </div>
            </div>
        </div>
    );
};

interface MessageLoadingProps {
    thinking?: ThinkingData | null;
}

export const MessageLoading = ({ thinking }: MessageLoadingProps) => {
    return (
        <div className="flex flex-col group px-2 pb-4">
            <div className="flex items-center gap-2 pl-2 mb-2">
                <Image
                    src="/logo.svg"
                    alt="Vibe"
                    width={18}
                    height={18}
                    className="shrink-0"
                />
                <span className="text-sm font-medium">
                    Vibe
                </span>
            </div>
            <div className="pl-8 flex flex-col gap-y-4">
                <ShimmerMessages thinking={thinking} />
            </div>
        </div>
    );
};
