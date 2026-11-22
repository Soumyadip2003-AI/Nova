"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import TextareaAutosize from "react-textarea-autosize";
import { z } from "zod";
import { toast } from "sonner";
import { useState, useEffect, useCallback } from "react";
import { ArrowUpIcon, Loader2Icon, Square } from "lucide-react";
import { useMutation, useQueryClient, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { Usage } from "./usage";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRouter } from "next/navigation";
import { ModelSelector } from "@/components/model-selector";

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
    const isMobile = useIsMobile();

    // Fetch project data for model selection
    const { data: project } = useSuspenseQuery(
        trpc.projects.getOne.queryOptions({ id: projectId })
    );

    // Always poll usage status every 5 seconds to catch credit updates
    // Credits are consumed asynchronously in the background, so we need continuous polling
    const { data: usage } = useQuery({
        ...trpc.usage.status.queryOptions(),
        refetchInterval: 5000, // Poll every 5s to catch async credit consumption
    });
    const showUsage = !!usage;

    // Model update mutation
    const updateModel = useMutation(
        trpc.projects.updateModel.mutationOptions({
            onSuccess: () => {
                queryClient.invalidateQueries(
                    trpc.projects.getOne.queryOptions({ id: projectId })
                );
            },
            onError: (error) => toast.error(error.message),
        })
    );

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
        if (!isThinking || isMobile) return;

        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                e.stopPropagation();
                handleStopThinking();
            }
        };

        document.addEventListener('keydown', handleGlobalKeyDown);
        return () => document.removeEventListener('keydown', handleGlobalKeyDown);
    }, [isThinking, handleStopThinking, isMobile]);

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
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className={cn(
                    "rounded-[20px] bg-card shadow-[inset_0_0_0_1px_var(--border),0_8px_24px_-16px_rgba(11,27,51,.3)]",
                    isFocused && "ring-2 ring-ring/60"
                )}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !isMobile) {
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
                <label htmlFor={`message-${projectId}`} className="sr-only">
                    Ask for a change
                </label>
                <div className="px-3.5 pt-3 pb-1.5">
                    <FormField
                        control={form.control}
                        name="value"
                        render={({ field }) => (
                            <TextareaAutosize
                                id={`message-${projectId}`}
                                minRows={2}
                                maxRows={8}
                                {...field}
                                readOnly={isThinking}
                                className={cn(
                                    "w-full resize-none border-none bg-transparent text-[15px] leading-relaxed outline-none",
                                    "placeholder:text-muted-foreground",
                                    isThinking && "cursor-not-allowed text-muted-foreground"
                                )}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                placeholder={isThinking ? "Nova is working on it" : "Ask for a change, in plain words"}
                            />
                        )}
                    />
                </div>

                <div className="flex items-center justify-between gap-2 px-3 pb-3 pt-1.5">
                    <div className="flex min-w-0 items-center gap-3">
                        <ModelSelector
                            value={project.model || "gpt-4o-mini"}
                            onChange={(model) => updateModel.mutate({ id: projectId, model })}
                            disabled={updateModel.isPending || isThinking}
                        />
                        <p className={cn("hidden items-center gap-1.5 font-mono text-xs text-muted-foreground", !isMobile && "lg:flex")}>
                            <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px]">Ctrl or Cmd + Enter</kbd>
                            to {isThinking ? "stop" : "send"}
                        </p>
                    </div>

                    {isThinking ? (
                        <Button
                            type="button"
                            onClick={handleStopThinking}
                            disabled={isCancelling}
                            variant="outline"
                            className="h-9 shrink-0 gap-2 rounded-full border border-destructive px-4 text-destructive hover:bg-muted hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            {isCancelling ? (
                                <>
                                    <Loader2Icon className="size-4 animate-spin" aria-hidden />
                                    <span>Stopping</span>
                                </>
                            ) : (
                                <>
                                    <Square className="size-3.5" fill="currentColor" aria-hidden />
                                    <span>Stop</span>
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button
                            type="submit"
                            disabled={isButtonDisabled}
                            className="h-9 shrink-0 gap-2 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                        >
                            Send
                            <ArrowUpIcon className="size-4" aria-hidden />
                        </Button>
                    )}
                </div>
            </form>
        </Form>
    );
};
