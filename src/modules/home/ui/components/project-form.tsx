"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import TextareaAutosize from "react-textarea-autosize";
import { z } from "zod";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { ArrowUpIcon, Loader2Icon, SparklesIcon, CrownIcon } from "lucide-react";
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

const formSchema = z.object({
    value: z.string()
        .min(1, { message: "Value is required" })
        .max(10000, { message: "Value is too long" }),
});

export const ProjectForm = () => {
    const trpc = useTRPC();
    const router = useRouter();
    const { isSignedIn } = useAuth();
    const [isFocused, setIsFocused] = useState(false);
    const isMobile = useIsMobile();

    // Fetch usage status
    const { data: usage, refetch: refetchUsage } = useQuery({
        ...trpc.usage.status.queryOptions(),
        enabled: isSignedIn,
    });

    const hasCredits = usage ? usage.remainingPoints > 0 : true;
    const isOutOfCredits = usage ? usage.remainingPoints <= 0 : false;

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
        const mutationPromise = createProject.mutateAsync({ value: submittedValue });

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

    return (
        <Form {...form}>
            <section className="space-y-5">
                {/* Usage Display for signed-in users */}
                {isSignedIn && usage && (
                    <div className={cn(
                        "rounded-xl p-4 transition-all duration-300",
                        "bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm",
                        "border",
                        isOutOfCredits
                            ? "border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20"
                            : usage.plan === "PRO"
                                ? "border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20"
                                : "border-zinc-200/80 dark:border-zinc-800/80"
                    )}>
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                {usage.plan === "PRO" && (
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <CrownIcon className="size-3.5 text-amber-500" />
                                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Pro Plan</span>
                                    </div>
                                )}
                                {isOutOfCredits ? (
                                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                                        You have run out of credits
                                    </p>
                                ) : (
                                    <p className="text-sm text-foreground">
                                        <span className="font-semibold">{usage.remainingPoints}</span>
                                        {usage.plan === "PRO" ? "" : " free"} credit{usage.remainingPoints !== 1 ? 's' : ''} remaining
                                        {usage.totalCredits && (
                                            <span className="text-muted-foreground"> / {usage.totalCredits}</span>
                                        )}
                                    </p>
                                )}
                                {resetDate && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Resets in {formatDuration(
                                            intervalToDuration({
                                                start: now,
                                                end: resetDate,
                                            }),
                                            { format: ["days", "hours", "minutes", "seconds"] }
                                        )}
                                    </p>
                                )}
                            </div>
                            {usage.plan !== "PRO" && (
                                <Button
                                    asChild
                                    size="sm"
                                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-300"
                                >
                                    <Link href="/pricing">
                                        <CrownIcon className="size-4 mr-1.5" /> Upgrade
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* Main Form Container */}
                <div className="relative group">
                    {/* Animated gradient border */}
                    <div className={cn(
                        "absolute -inset-[1px] bg-gradient-to-r from-amber-500/50 via-orange-500/50 to-rose-500/50 rounded-2xl blur-sm opacity-0 transition-all duration-500",
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
                            "relative p-5 rounded-2xl transition-all duration-300",
                            "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl",
                            "border border-zinc-200/80 dark:border-zinc-800/80",
                            "shadow-lg shadow-zinc-200/50 dark:shadow-zinc-900/50",
                            isFocused && "border-amber-500/30 dark:border-amber-500/30"
                        )}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !isMobile) {
                                e.preventDefault();
                                e.stopPropagation();
                                form.handleSubmit(onSubmit)(e);
                            }
                        }}
                    >
                        {/* Textarea */}
                        <FormField
                            control={form.control}
                            name="value"
                            render={({ field }) => (
                                <TextareaAutosize
                                    minRows={3}
                                    maxRows={8}
                                    {...field}
                                    readOnly={isSubmitting}
                                    className={cn(
                                        "w-full resize-none border-none outline-none bg-transparent text-base leading-relaxed",
                                        "placeholder:text-muted-foreground/60",
                                        isSubmitting && "cursor-not-allowed opacity-60"
                                    )}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                    placeholder={isSubmitting ? "Creating your project..." : "Describe what you want to build..."}
                                />
                            )}
                        />

                        {/* Bottom bar */}
                        <div className="flex items-center justify-between pt-4 mt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
                            <div className={cn("hidden items-center gap-2 text-xs text-muted-foreground", !isMobile && "sm:flex")}>
                                <kbd className="inline-flex h-5 items-center gap-1 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-100/80 dark:bg-zinc-800/80 px-1.5 font-mono text-[10px] font-medium">
                                    <span className="text-xs">⌘/Ctrl</span>
                                    <span>Enter</span>
                                </kbd>
                                <span className="hidden sm:inline">to submit</span>
                            </div>

                            <Button
                                type="submit"
                                disabled={isButtonDisabled}
                                className={cn(
                                    "h-10 px-4 rounded-xl font-medium transition-all duration-300",
                                    "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600",
                                    "text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40",
                                    "disabled:opacity-50 disabled:shadow-none disabled:from-zinc-400 disabled:to-zinc-500"
                                )}
                            >
                                {isSubmitting ? (
                                    <Loader2Icon className="size-4 animate-spin" />
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <SparklesIcon className="size-4" />
                                        <span className="hidden sm:inline">Create</span>
                                        <ArrowUpIcon className="size-4 sm:hidden" />
                                    </div>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Template buttons */}
                <div className="hidden md:flex flex-wrap justify-center gap-2">
                    {PROJECT_TEMPLATES.map((template, index) => (
                        <Button
                            key={template.title}
                            variant="outline"
                            size="sm"
                            onClick={() => onSelect(template.prompt)}
                            className={cn(
                                "rounded-full px-4 h-9 transition-all duration-300 animate-fade-in",
                                "bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm",
                                "border-zinc-200/80 dark:border-zinc-800/80",
                                "hover:border-amber-500/40 hover:bg-amber-50/50 dark:hover:bg-amber-950/30",
                                "hover:shadow-md hover:shadow-amber-500/10",
                                "hover:-translate-y-0.5"
                            )}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <span className="mr-1.5">{template.emoji}</span>
                            <span className="text-sm">{template.title}</span>
                        </Button>
                    ))}
                </div>
            </section>
        </Form>
    );
};
