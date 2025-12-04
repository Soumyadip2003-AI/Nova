import Image from "next/image";
import { useState, useEffect } from "react";
import { ChevronRight, Sparkles, Brain, Zap, Check } from "lucide-react";
import { cn } from "@/lib/utils";

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

// Typing indicator component (like ChatGPT)
const TypingIndicator = () => {
    return (
        <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
        </div>
    );
};

// Step weights for realistic progress calculation
const STEP_WEIGHTS: Record<string, number> = {
    "Setting up environment": 15,
    "Planning implementation": 20,
    "Writing code": 50,  // Longest step - agent iterations
    "Preparing preview": 15
};

// Progress bar for active step (like Claude)
const ProgressBar = ({ duration = 3000 }: { duration?: number }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 95) return prev; // Cap at 95% until actually complete
                return prev + (100 - prev) * 0.1; // Exponential slowdown
            });
        }, 100);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary/10 overflow-hidden rounded-full">
            <div
                className="h-full bg-gradient-to-r from-primary/50 via-primary to-primary/50 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
            >
                <div className="h-full w-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>
        </div>
    );
};

// Sparkle animation for completed steps (like Gemini)
const SparkleEffect = () => {
    return (
        <div className="absolute -top-1 -right-1 pointer-events-none">
            <Sparkles className="w-3 h-3 text-primary animate-pulse" />
        </div>
    );
};

// Step icon component with smooth transitions
const StepIcon = ({ completed, isCurrent }: { completed: boolean; isCurrent: boolean }) => {
    if (completed) {
        return (
            <div className="relative h-5 w-5 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0 animate-in zoom-in duration-300">
                <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            </div>
        );
    }

    if (isCurrent) {
        return (
            <div className="relative h-5 w-5 shrink-0">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 animate-pulse" />
                <div className="absolute inset-0 rounded-full border-2 border-primary/30" />
                <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" style={{ animationDuration: '1s' }} />
                <div className="absolute inset-1 rounded-full bg-gradient-to-br from-primary/40 to-transparent animate-pulse" />
            </div>
        );
    }

    return (
        <div className="h-5 w-5 rounded-full border-2 border-border shrink-0" />
    );
};

const ShimmerMessages = ({ thinking }: ShimmerMessagesProps) => {
    const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
    const [visibleSteps, setVisibleSteps] = useState<number>(0);

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

    // Progressive reveal animation
    useEffect(() => {
        if (thinking?.steps) {
            const completedCount = thinking.steps.filter(s => s.completed).length;
            const currentIndex = thinking.steps.findIndex(s => !s.completed);
            const shouldShow = currentIndex >= 0 ? currentIndex + 1 : completedCount;

            if (shouldShow > visibleSteps) {
                const timer = setTimeout(() => {
                    setVisibleSteps(shouldShow);
                }, 100);
                return () => clearTimeout(timer);
            } else {
                setVisibleSteps(shouldShow);
            }
        }
    }, [thinking?.steps, visibleSteps]);

    // If we have thinking data, show it
    if (thinking && thinking.steps && thinking.steps.length > 0) {
        const currentStepIndex = thinking.steps.findIndex(step => !step.completed);
        const allCompleted = currentStepIndex === -1;
        const completedCount = thinking.steps.filter(s => s.completed).length;

        // Calculate weighted progress
        const totalWeight = thinking.steps.reduce((sum, step) => {
            return sum + (STEP_WEIGHTS[step.title] || 25); // Default weight if not found
        }, 0);

        const completedWeight = thinking.steps.reduce((sum, step) => {
            if (step.completed) {
                return sum + (STEP_WEIGHTS[step.title] || 25);
            }
            return sum;
        }, 0);

        const weightedProgress = Math.round((completedWeight / totalWeight) * 100);

        return (
            <div className="flex flex-col gap-3 p-5 rounded-2xl border bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header */}
                <div className="flex items-center gap-3">
                    {allCompleted ? (
                        <div className="relative h-6 w-6 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shrink-0 animate-in zoom-in duration-500">
                            <Check className="w-4 h-4 text-primary-foreground" strokeWidth={3} />
                            <div className="absolute inset-0 rounded-full bg-primary/30 animate-pulse" />
                        </div>
                    ) : (
                        <div className="relative h-6 w-6 shrink-0">
                            <Brain className="w-6 h-6 text-primary animate-pulse" />
                            <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: '2s' }} />
                        </div>
                    )}
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="text-base font-semibold text-foreground">
                                {allCompleted ? 'Thought complete' : 'Thinking'}
                            </span>
                            {!allCompleted && (
                                <TypingIndicator />
                            )}
                        </div>
                        {!allCompleted && (
                            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                                <span>Step {completedCount + 1} of {thinking.steps.length}</span>
                                <span className="text-primary">•</span>
                                <span className="font-medium text-primary">{weightedProgress}%</span>
                                <span className="text-primary">•</span>
                                <span className="animate-pulse">Processing...</span>
                            </div>
                        )}
                        {allCompleted && (
                            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                <span>All steps completed</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress indicator with weighted segments */}
                {!allCompleted && thinking.steps.length > 0 && (
                    <div className="flex items-center gap-1.5">
                        {thinking.steps.map((step, index) => {
                            const stepWeight = STEP_WEIGHTS[step.title] || 25;
                            const widthPercentage = (stepWeight / totalWeight) * 100;

                            return (
                                <div
                                    key={index}
                                    className={cn(
                                        "h-1 rounded-full transition-all duration-500",
                                        step.completed
                                            ? "bg-gradient-to-r from-primary to-primary/80"
                                            : index === currentStepIndex
                                            ? "bg-primary/30 relative overflow-hidden"
                                            : "bg-border"
                                    )}
                                    style={{ width: `${widthPercentage}%` }}
                                >
                                    {index === currentStepIndex && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-shimmer" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Steps */}
                <div className="space-y-2">
                    {thinking.steps.slice(0, visibleSteps).map((step, index) => {
                        const isCurrent = index === currentStepIndex;
                        const isExpanded = expandedSteps.has(index);

                        return (
                            <div
                                key={index}
                                className={cn(
                                    "rounded-xl border transition-all duration-300 animate-in slide-in-from-left fade-in overflow-hidden",
                                    isCurrent
                                        ? 'bg-gradient-to-r from-primary/5 to-primary/10 border-primary/30 shadow-sm'
                                        : step.completed
                                        ? 'bg-background/50 border-border hover:border-primary/20 hover:bg-background/80'
                                        : 'bg-background/30 border-border/50'
                                )}
                                style={{
                                    animationDelay: `${index * 50}ms`,
                                    animationFillMode: 'both'
                                }}
                            >
                                {/* Progress bar for current step */}
                                {isCurrent && <ProgressBar />}

                                <button
                                    onClick={() => step.completed && step.content && toggleStep(index)}
                                    className={cn(
                                        "flex items-start gap-3 text-left w-full p-3.5 transition-all",
                                        step.completed && step.content && "cursor-pointer hover:bg-primary/5"
                                    )}
                                    disabled={!step.completed || !step.content}
                                >
                                    <div className="relative mt-0.5">
                                        <StepIcon completed={step.completed} isCurrent={isCurrent} />
                                        {step.completed && <SparkleEffect />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <span className={cn(
                                                    "text-sm font-medium transition-colors",
                                                    isCurrent ? 'text-foreground' : 'text-muted-foreground'
                                                )}>
                                                    {step.title}
                                                </span>
                                                {isCurrent && (
                                                    <Zap className="w-3.5 h-3.5 text-primary animate-pulse shrink-0" />
                                                )}
                                            </div>
                                            {step.completed && step.content && (
                                                <ChevronRight
                                                    className={cn(
                                                        "h-4 w-4 text-muted-foreground transition-transform shrink-0 duration-300",
                                                        isExpanded && 'rotate-90'
                                                    )}
                                                />
                                            )}
                                        </div>

                                        {/* Expanded content */}
                                        {isExpanded && step.completed && step.content && (
                                            <div className="text-xs text-muted-foreground/80 mt-2.5 leading-relaxed whitespace-pre-wrap animate-in fade-in slide-in-from-top-2 duration-300 pl-1 border-l-2 border-primary/20">
                                                <div className="pl-3">
                                                    {step.content}
                                                </div>
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
        <div className="flex flex-col gap-3 p-5 rounded-2xl border bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3">
                <div className="relative h-6 w-6 shrink-0">
                    <Brain className="w-6 h-6 text-primary animate-pulse" />
                    <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: '2s' }} />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-base font-semibold text-foreground">Thinking</span>
                        <TypingIndicator />
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 animate-pulse">
                        Processing your request...
                    </div>
                </div>
            </div>

            {/* Shimmer skeleton */}
            <div className="space-y-2 mt-2">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="h-12 rounded-xl bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50 animate-shimmer"
                        style={{
                            animationDelay: `${i * 0.2}s`,
                            animationDuration: '2s'
                        }}
                    />
                ))}
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
            <div className="flex items-center gap-2 pl-2 mb-3">
                <div className="relative">
                    <Image
                        src="/logo.svg"
                        alt="Vibe"
                        width={20}
                        height={20}
                        className="shrink-0"
                    />
                    <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
                </div>
                <span className="text-sm font-semibold">
                    Vibe
                </span>
            </div>
            <div className="pl-8 flex flex-col gap-y-4">
                <ShimmerMessages thinking={thinking} />
            </div>
        </div>
    );
};
