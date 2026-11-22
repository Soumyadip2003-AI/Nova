"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import TextareaAutosize from "react-textarea-autosize";
import { z } from "zod";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Loader2Icon, CircleAlertIcon } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { useRouter } from "next/navigation";
import { PROJECT_TEMPLATES } from "../../constants";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { formatDuration, intervalToDuration } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { ModelSelector } from "@/components/model-selector";
import { getDefaultModel } from "@/lib/models";

const formSchema = z.object({
    value: z.string()
        .min(1, { message: "Value is required" })
        .max(10000, { message: "Value is too long" }),
});

export const ProjectForm = () => {
    const trpc = useTRPC();
    const router = useRouter();
    const { isSignedIn } = useAuth();
    const isMobile = useIsMobile();

    // Fetch usage status
    const { data: usage, refetch: refetchUsage } = useQuery({
        ...trpc.usage.status.queryOptions(),
        // isSignedIn is undefined while Clerk loads, and TanStack treats
        // enabled: undefined as true, so only an explicit true may fetch.
        enabled: isSignedIn === true,
    });

    const hasCredits = usage ? usage.remainingPoints > 0 : true;
    const isOutOfCredits = usage ? usage.remainingPoints <= 0 : false;
    const isPro = usage?.plan === "PRO";

    // Model selection state
    const [selectedModel, setSelectedModel] = useState<string>(() => getDefaultModel(false));

    // Update default model when plan status changes
    useEffect(() => {
        if (usage) {
            setSelectedModel(getDefaultModel(isPro));
        }
    }, [usage, isPro]);

    // Live countdown timer state
    const [now, setNow] = useState(new Date());
    const [resetDate, setResetDate] = useState<Date | null>(null);

    // Update resetDate when usage data changes
    useEffect(() => {
        if (usage?.msBeforeNext) {
            setResetDate(new Date(Date.now() + usage.msBeforeNext));
        }
    }, [usage?.msBeforeNext]);

    // Update 'now' every second for live countdown
    useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            value: "",
        },
    });

    const createProject = useMutation(trpc.projects.create.mutationOptions({
        onSuccess: () => {
            // Refetch usage after successful project creation
            refetchUsage();
        },
        onError: (error) => {
            toast.error(error.message);
            form.setValue("value", form.getValues().value);
        },
    }));

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        // Redirect to sign-in if not authenticated
        if (!isSignedIn) {
            router.push("/sign-in");
            return;
        }

        // Check if user has credits
        if (!hasCredits) {
            toast.error("You have run out of credits. Please upgrade to continue.");
            return;
        }

        // Store the value before resetting
        const submittedValue = values.value;
        form.reset({ value: "" });

        // Optimistic mutation: start the mutation and get the promise
        const mutationPromise = createProject.mutateAsync({ value: submittedValue, model: selectedModel });

        // Wait for the mutation to complete and get the project ID
        mutationPromise.then((data) => {
            // Navigate immediately once we have the project ID
            router.push(`/projects/${data.id}`);
        }).catch((error) => {
            // Error already handled by onError callback
            console.error("Project creation failed:", error);
        });
    };

    const onSelect = (value: string) => {
        form.setValue("value", value, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
        });
    };

    const isButtonDisabled = !form.formState.isValid || createProject.isPending || (isSignedIn && isOutOfCredits);
    const isSubmitting = createProject.isPending;

    const countdown = resetDate
        ? formatDuration(
            intervalToDuration({
                start: now,
                end: resetDate,
            }),
            { format: ["days", "hours", "minutes", "seconds"] }
        )
        : null;

    return (
        <Form {...form}>
            <section className="space-y-4">
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className={cn(
                        "rounded-2xl border-[1.5px] border-foreground bg-card p-4 shadow-stamp sm:p-5",
                        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background"
                    )}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !isMobile) {
                            e.preventDefault();
                            e.stopPropagation();
                            form.handleSubmit(onSubmit)(e);
                        }
                    }}
                >
                    <label htmlFor="project-idea" className="block font-mono text-xs text-muted-foreground">
                        What do you want to build?
                    </label>
                    <FormField
                        control={form.control}
                        name="value"
                        render={({ field }) => (
                            <TextareaAutosize
                                id="project-idea"
                                minRows={3}
                                maxRows={8}
                                {...field}
                                readOnly={isSubmitting}
                                className={cn(
                                    "mt-2 w-full resize-none border-none bg-transparent text-lg leading-normal text-foreground outline-none",
                                    "placeholder:text-muted-foreground",
                                    isSubmitting && "cursor-not-allowed opacity-60"
                                )}
                                placeholder={isSubmitting ? "Starting your project…" : "For example: a booking page for my yoga classes, with a calendar and a sign-up form"}
                            />
                        )}
                    />

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex min-w-0 flex-wrap items-center gap-3">
                            {isSignedIn && (
                                <ModelSelector
                                    value={selectedModel}
                                    onChange={setSelectedModel}
                                    disabled={isSubmitting}
                                />
                            )}
                            <span className="text-[13px] text-muted-foreground">
                                {isSignedIn ? "Uses 1 credit." : "Uses 1 credit. You get 5 free each month."}
                            </span>
                        </div>

                        <Button
                            type="submit"
                            disabled={isButtonDisabled}
                            className="ml-auto h-12 rounded-[10px] px-[22px] text-base font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
                                    Starting…
                                </>
                            ) : (
                                "Build it"
                            )}
                        </Button>
                    </div>
                    <p className={cn("mt-3 hidden text-xs text-muted-foreground", !isMobile && "sm:block")}>
                        Press <kbd className="rounded-md border border-border bg-muted px-1.5 font-mono text-[11px]">Ctrl</kbd> or{" "}
                        <kbd className="rounded-md border border-border bg-muted px-1.5 font-mono text-[11px]">Cmd</kbd> +{" "}
                        <kbd className="rounded-md border border-border bg-muted px-1.5 font-mono text-[11px]">Enter</kbd> to build.
                    </p>
                </form>

                {isSignedIn && usage && (
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 font-mono text-[13px] text-muted-foreground">
                        {isOutOfCredits ? (
                            <p className="flex items-center gap-1.5 font-medium text-foreground">
                                <CircleAlertIcon className="size-4 shrink-0 text-destructive" aria-hidden="true" />
                                You have run out of credits.
                            </p>
                        ) : (
                            <p>
                                <span className="font-medium text-foreground">{usage.remainingPoints}</span>
                                {usage.totalCredits ? ` of ${usage.totalCredits}` : ""}{" "}
                                {usage.plan === "PRO" ? "Pro" : "free"} credit{usage.remainingPoints !== 1 ? "s" : ""} left
                            </p>
                        )}
                        {countdown && <p>Resets in {countdown}</p>}
                        {usage.plan !== "PRO" && (
                            <Link
                                href="/pricing"
                                className="rounded-[10px] font-sans font-medium text-foreground underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                Upgrade to Pro
                            </Link>
                        )}
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                    <span className="mr-1 font-mono text-xs text-muted-foreground">Or start from</span>
                    {PROJECT_TEMPLATES.map((template) => (
                        <button
                            key={template.title}
                            type="button"
                            onClick={() => onSelect(template.prompt)}
                            className={cn(
                                "h-9 rounded-full border-[1.5px] border-foreground bg-card px-3.5 text-sm text-foreground",
                                "hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            )}
                        >
                            {template.title.replace(/^Build an? /, "").replace(/^./, (c) => c.toUpperCase())}
                        </button>
                    ))}
                </div>
            </section>
        </Form>
    );
};
