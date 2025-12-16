"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import TextareaAutosize from "react-textarea-autosize";
import { z } from "zod";
import { toast } from "sonner";
import { useState, useEffect, useCallback } from "react";
import { ArrowUpIcon, Loader2Icon, Square, SparklesIcon } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { Hint } from "@/components/hint";
import { Usage } from "./usage";
import { useRouter } from "next/navigation";

interface Props {
    projectId: string;
    isThinking?: boolean;
    onCancelThinking?: () => void;
}

const formSchema = z.object({
    value: z.string()
        .min(1, { message: "Value is required" })
        .max(10000, { message: "Value is too long" }),
});

export const MessageForm = ({ projectId, isThinking = false, onCancelThinking }: Props) => {
    const trpc = useTRPC();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isCancelling, setIsCancelling] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    // Always poll usage status every 5 seconds to catch credit updates
    // Credits are consumed asynchronously in the background, so we need continuous polling
    const { data: usage } = useQuery({
        ...trpc.usage.status.queryOptions(),
        refetchInterval: 5000, // Poll every 5s to catch async credit consumption
    });
    const showUsage = !!usage;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            value: "",
        },
    });

    const createMessage = useMutation(trpc.messages.create.mutationOptions({
        onSuccess: () => {
            // Invalidate queries after successful message creation
            queryClient.invalidateQueries(
                trpc.messages.getMany.queryOptions({ projectId }),
            );
            queryClient.invalidateQueries(
                trpc.usage.status.queryOptions(),
            );
        },
        onError: (error) => {
            toast.error(error.message);

            if(error.data?.code=== "TOO_MANY_REQUESTS")
            {
                router.push("/pricing");
            }
        },
    }));

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        form.reset({ value: "" });
        createMessage.mutate({
            value: values.value,
            projectId,
        });
    };

    const handleStopThinking = useCallback(async () => {
        if (isCancelling || !onCancelThinking) return;

        setIsCancelling(true);
        try {
            const response = await fetch('/api/cancel-thinking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId })
            });

            if (response.ok) {
                onCancelThinking();
                toast.success("Task cancelled");
            } else {
                toast.error("Failed to cancel task");
            }
        } catch (error) {
            console.error('Error cancelling:', error);
            toast.error("Failed to cancel task");
        } finally {
            setIsCancelling(false);
        }
    }, [isCancelling, onCancelThinking, projectId]);

    const isButtonDisabled = !form.formState.isValid && !isThinking;

    // Global keyboard shortcut for cancel
    useEffect(() => {
        if (!isThinking) return;

        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                e.stopPropagation();
                handleStopThinking();
            }
        };

        document.addEventListener('keydown', handleGlobalKeyDown);
        return () => document.removeEventListener('keydown', handleGlobalKeyDown);
    }, [isThinking, handleStopThinking]);

    return (
        <Form {...form}>
            {showUsage && (
                <Usage
                    points={usage.remainingPoints}
                    msBeforeNext={usage.msBeforeNext}
                    plan={usage.plan}
                    totalCredits={usage.totalCredits}
                />
            )}
            <div className="relative group">
                {/* Animated gradient border */}
                <div className={cn(
                    "absolute -inset-px bg-gradient-to-r from-amber-500/50 via-orange-500/50 to-rose-500/50 rounded-2xl blur-sm opacity-0 transition-all duration-500",
                    isFocused && "opacity-100"
                )} />

                {/* Glow effect */}
                <div className={cn(
                    "absolute -inset-2 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-rose-500/20 rounded-3xl blur-xl opacity-0 transition-all duration-500",
                    isFocused && "opacity-100"
                )} />

                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className={cn(
                        "relative rounded-2xl transition-all duration-300",
                        "bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl",
                        "border border-zinc-200/80 dark:border-zinc-800/80",
                        "shadow-lg shadow-zinc-200/30 dark:shadow-zinc-900/30",
                        isFocused && "border-amber-500/30 dark:border-amber-500/30"
                    )}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                            e.preventDefault();
                            e.stopPropagation();
                            if (isThinking) {
                                handleStopThinking();
                            } else {
                                form.handleSubmit(onSubmit)(e);
                            }
                        }
                    }}
                >
                    {/* Input area */}
                    <div className="p-4 pb-2">
                        <FormField
                            control={form.control}
                            name="value"
                            render={({ field }) => (
                                <TextareaAutosize
                                    minRows={2}
                                    maxRows={8}
                                    {...field}
                                    readOnly={isThinking}
                                    className={cn(
                                        "resize-none border-none w-full outline-none bg-transparent text-sm leading-relaxed",
                                        "placeholder:text-muted-foreground/60",
                                        isThinking && "cursor-not-allowed opacity-60"
                                    )}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                    placeholder={isThinking ? "Nova is thinking..." : "What would you like to build?"}
                                />
                            )}
                        />
                    </div>

                    {/* Footer with actions */}
                    <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200/60 dark:border-zinc-800/60">
                        {/* Keyboard hint */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <kbd className="inline-flex h-5 items-center gap-1 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-100/80 dark:bg-zinc-800/80 px-1.5 font-mono text-[10px] font-medium shadow-sm">
                                <span className="text-xs">⌘/Ctrl</span>
                                <span>Enter</span>
                            </kbd>
                            <span className="hidden sm:inline">to {isThinking ? "cancel" : "send"}</span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                            {isThinking ? (
                                <Hint text="Stop generating" side="top">
                                    <Button
                                        type="button"
                                        onClick={handleStopThinking}
                                        disabled={isCancelling}
                                        size="sm"
                                        className={cn(
                                            "h-9 px-4 rounded-xl gap-2 transition-all duration-300",
                                            "bg-red-500 hover:bg-red-600 text-white",
                                            "shadow-lg shadow-red-500/20 hover:shadow-red-500/30",
                                            isCancelling && "opacity-50"
                                        )}
                                    >
                                        {isCancelling ? (
                                            <Loader2Icon className="size-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Square className="size-3.5" fill="currentColor" />
                                                <span className="text-xs font-medium">Stop</span>
                                            </>
                                        )}
                                    </Button>
                                </Hint>
                            ) : (
                                <Hint text="Send message" side="top">
                                    <Button
                                        type="submit"
                                        disabled={isButtonDisabled}
                                        size="sm"
                                        className={cn(
                                            "h-9 px-4 rounded-xl gap-2 transition-all duration-300",
                                            isButtonDisabled
                                                ? "bg-muted text-muted-foreground border border-border/50"
                                                : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30"
                                        )}
                                    >
                                        <SparklesIcon className="size-3.5" />
                                        <span className="text-xs font-medium">Send</span>
                                        <ArrowUpIcon className="size-3.5" />
                                    </Button>
                                </Hint>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </Form>
    );
};
