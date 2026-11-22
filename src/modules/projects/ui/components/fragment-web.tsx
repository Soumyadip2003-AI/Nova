"use client";

import { Fragment } from "@/generated/prisma";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";
import { ExternalLinkIcon, RefreshCcwIcon, CopyIcon, CheckIcon, GlobeIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/hint";

interface Props {
    data: Fragment;
}

const iconButton =
    "size-9 rounded-xl p-0 text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring";

export function FragmentWeb({ data }: Props) {
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    // The URL changes when a stopped preview is started again.
    const [url, setUrl] = useState(data.sandboxUrl);
    const [fragmentKey, setFragmentKey] = useState(0);
    // Sandboxes stop after a few minutes; check, and re-check every minute.
    const alive = useQuery({
        ...trpc.projects.previewAlive.queryOptions({ fragmentId: data.id }),
        refetchInterval: 60_000,
    });
    const isStopped = alive.data?.alive === false;
    const restart = useMutation(trpc.projects.restartPreview.mutationOptions({
        onSuccess: (fragment) => {
            setUrl(fragment.sandboxUrl);
            setFragmentKey((k) => k + 1);
            setIsLoading(true);
            queryClient.setQueryData(
                trpc.projects.previewAlive.queryKey({ fragmentId: data.id }),
                { alive: true },
            );
        },
        onError: (error) => toast.error(error.message),
    }));
    const [copied, setCopied] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [isLoading, setIsLoading] = useState(!!url);

    const onRefresh = () => {
        setFragmentKey((prev) => prev + 1);
        setLoadError(false);
        setIsLoading(true);
    };

    const handleCopy = async () => {
        if (!url) return;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error("Failed to copy URL:", error);
        }
    };

    return (
        <div className="flex h-full w-full flex-col bg-card">
            {/* Toolbar */}
            <div className="flex items-center gap-1.5 border-b border-border p-2">
                <Hint text="Reload preview" side="bottom" align="start">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onRefresh}
                        aria-label="Reload preview"
                        className={iconButton}
                    >
                        <RefreshCcwIcon className="size-4" aria-hidden />
                    </Button>
                </Hint>

                <div className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-xl bg-muted px-3">
                    <GlobeIcon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="truncate font-mono text-xs text-muted-foreground">
                        {url}
                    </span>
                </div>

                <Hint text={copied ? "Copied" : "Copy link"} side="bottom">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCopy}
                        disabled={!url}
                        aria-label={copied ? "Link copied" : "Copy link"}
                        className={iconButton}
                    >
                        {copied ? (
                            <CheckIcon className="size-4 text-success-strong" aria-hidden />
                        ) : (
                            <CopyIcon className="size-4" aria-hidden />
                        )}
                    </Button>
                </Hint>

                <Hint text="Open in new tab" side="bottom" align="end">
                    <Button
                        size="sm"
                        variant="ghost"
                        disabled={!url}
                        aria-label="Open in new tab"
                        onClick={() => {
                            if (url) {
                                window.open(url, "_blank");
                            }
                        }}
                        className={iconButton}
                    >
                        <ExternalLinkIcon className="size-4" aria-hidden />
                    </Button>
                </Hint>
                <span className="sr-only" aria-live="polite">
                    {copied ? "Link copied" : ""}
                </span>
            </div>

            {/* Preview area */}
            <div className="relative flex-1">
                {isStopped ? (
                    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center" role="status">
                        <span className="mb-5 flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
                            <GlobeIcon className="size-5" aria-hidden />
                        </span>
                        <h3 className="text-lg font-bold">This preview has stopped</h3>
                        <p className="mt-2 mb-6 max-w-xs text-sm text-muted-foreground">
                            Previews pause after a few minutes. Your code is saved; start it again in a few seconds. This does not use a credit.
                        </p>
                        <Button
                            onClick={() => restart.mutate({ fragmentId: data.id })}
                            disabled={restart.isPending}
                            className="h-10 gap-2 rounded-full px-5 font-bold focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            {restart.isPending ? (
                                <Loader2Icon className="size-4 animate-spin" aria-hidden />
                            ) : (
                                <RefreshCcwIcon className="size-4" aria-hidden />
                            )}
                            {restart.isPending ? "Starting" : "Start preview again"}
                        </Button>
                    </div>
                ) : loadError ? (
                    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center" role="alert">
                        <span className="mb-5 flex size-12 items-center justify-center rounded-xl bg-destructive-soft">
                            <GlobeIcon className="size-5 text-destructive" aria-hidden />
                        </span>
                        <h3 className="text-lg font-bold">The preview did not load</h3>
                        <p className="mt-2 mb-6 max-w-xs text-sm text-muted-foreground">
                            Your app may still be starting. Reload to try again.
                        </p>
                        <Button
                            onClick={onRefresh}
                            className="h-10 gap-2 rounded-xl px-4 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <RefreshCcwIcon className="size-4" aria-hidden />
                            Try again
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Also wait for the liveness check: a stopped sandbox otherwise
                            flashes E2B's raw "502 sandbox not found" page first. */}
                        {(isLoading || alive.isPending) && (
                            <div
                                className="absolute inset-0 z-10 flex items-center justify-center bg-card"
                                role="status"
                            >
                                <div className="flex flex-col items-center gap-3">
                                    <Loader2Icon className="size-6 animate-spin text-muted-foreground" aria-hidden />
                                    <span className="text-sm text-muted-foreground">Loading preview</span>
                                </div>
                            </div>
                        )}

                        {url ? (
                            <iframe
                                key={fragmentKey}
                                className="h-full w-full bg-white"
                                sandbox="allow-forms allow-scripts allow-same-origin"
                                loading="lazy"
                                src={url}
                                onLoad={() => setIsLoading(false)}
                                onError={() => {
                                    setLoadError(true);
                                    setIsLoading(false);
                                }}
                                title="Preview of your app"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center p-8">
                                <p className="text-sm text-muted-foreground">This version has no preview link.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
