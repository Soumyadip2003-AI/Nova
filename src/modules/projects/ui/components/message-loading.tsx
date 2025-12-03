import Image from "next/image";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

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

        return (
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                    <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                    <span>Thinking...</span>
                </div>

                <div className="space-y-1 pl-5 border-l-2 border-muted">
                    {thinking.steps.map((step, index) => {
                        const isCurrent = index === currentStepIndex;
                        const isExpanded = expandedSteps.has(index);
                        const isVisible = step.completed || isCurrent;

                        if (!isVisible) return null;

                        return (
                            <div key={index} className="ml-3">
                                <button
                                    onClick={() => toggleStep(index)}
                                    className="flex items-start gap-2 text-left w-full group/step hover:opacity-80 transition-opacity"
                                    disabled={!step.completed}
                                >
                                    <div className="mt-0.5">
                                        {step.completed ? (
                                            isExpanded ? (
                                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                            ) : (
                                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                            )
                                        ) : (
                                            <div className="h-3.5 w-3.5 rounded-full border-2 border-primary animate-pulse" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className={`text-sm ${isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                            {step.title}
                                        </div>
                                        {isExpanded && step.completed && step.content && (
                                            <div className="text-xs text-muted-foreground/70 mt-1 pr-4 whitespace-pre-wrap">
                                                {step.content}
                                            </div>
                                        )}
                                        {isCurrent && (
                                            <div className="flex items-center gap-1 mt-1">
                                                <div className="h-1 w-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <div className="h-1 w-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <div className="h-1 w-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        )}
                                    </div>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // Default loading animation when no thinking data
    return (
        <div className="flex items-center gap-2">
            <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
            <span className="text-sm text-muted-foreground">Thinking...</span>
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
