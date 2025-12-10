"use client";

import { Fragment } from "@/generated/prisma";
import { useState } from "react";
import { ExternalLinkIcon, RefreshCcwIcon, CopyIcon, CheckIcon, GlobeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/hint";
import { cn } from "@/lib/utils";

interface Props {
    data: Fragment;
}

export function FragmentWeb({ data }: Props) {
    const [fragmentKey, setFragmentKey] = useState(0);
    const [copied, setCopied] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [isLoading, setIsLoading] = useState(!!data.sandboxUrl);

    const onRefresh = () => {
        setFragmentKey((prev) => prev + 1);
        setLoadError(false);
        setIsLoading(true);
    };

    const handleCopy = async () => {
        if (!data.sandboxUrl) return;
        try {
            await navigator.clipboard.writeText(data.sandboxUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error("Failed to copy URL:", error);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-muted/20">
            {/* Header toolbar */}
            <div className="p-2 border-b bg-card/80 backdrop-blur-sm flex items-center gap-2">
                {/* Refresh button */}
                <Hint text="Refresh preview" side="bottom" align="start">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onRefresh}
                        className="h-8 w-8 p-0 rounded-lg hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-600 dark:hover:text-amber-400 transition-all"
                    >
                        <RefreshCcwIcon className="size-4" />
                    </Button>
                </Hint>

                {/* URL display */}
                <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/50 min-w-0">
                    <GlobeIcon className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground truncate font-mono">
                        {data.sandboxUrl}
                    </span>
                </div>

                {/* Copy URL button */}
                <Hint text={copied ? "Copied!" : "Copy URL"} side="bottom">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopy}
                        disabled={!data.sandboxUrl}
                        className={cn(
                            "h-8 w-8 p-0 rounded-lg transition-all",
                            copied
                                ? "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400"
                                : "hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-600 dark:hover:text-amber-400"
                        )}
                    >
                        {copied ? (
                            <CheckIcon className="size-4" />
                        ) : (
                            <CopyIcon className="size-4" />
                        )}
                    </Button>
                </Hint>

                {/* Open in new tab button */}
                <Hint text="Open in new tab" side="bottom" align="end">
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={!data.sandboxUrl}
                        onClick={() => {
                            if (data.sandboxUrl) {
                                window.open(data.sandboxUrl, "_blank");
                            }
                        }}
                        className="h-8 w-8 p-0 rounded-lg hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-600 dark:hover:text-amber-400 transition-all"
                    >
                        <ExternalLinkIcon className="size-4" />
                    </Button>
                </Hint>
            </div>

            {/* Preview area */}
            <div className="flex-1 relative">
                {loadError ? (
                    <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-muted/30 to-muted/10 p-8">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-3xl blur-2xl" />
                            <div className="relative size-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center border border-red-200/50 dark:border-red-500/20">
                                <GlobeIcon className="size-7 text-red-500" />
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Failed to load preview</h3>
                        <p className="text-sm text-muted-foreground mb-6 text-center max-w-xs">
                            The sandbox environment could not be loaded. Please try again.
                        </p>
                        <Button
                            onClick={onRefresh}
                            variant="outline"
                            size="sm"
                            className="rounded-xl gap-2 hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-600 dark:hover:text-amber-400"
                        >
                            <RefreshCcwIcon className="size-4" />
                            Try Again
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Loading overlay */}
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/30 to-orange-500/30 rounded-full blur-xl animate-pulse" />
                                        <div className="relative size-10 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
                                    </div>
                                    <span className="text-sm text-muted-foreground">Loading preview...</span>
                                </div>
                            </div>
                        )}

                        {/* Iframe */}
                        {data.sandboxUrl ? (
                            <iframe
                                key={fragmentKey}
                                className="h-full w-full bg-white"
                                sandbox="allow-forms allow-scripts allow-same-origin"
                                loading="lazy"
                                src={data.sandboxUrl}
                                onLoad={() => setIsLoading(false)}
                                onError={() => {
                                    setLoadError(true);
                                    setIsLoading(false);
                                }}
                                title="Code preview"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-muted-foreground">No preview URL available</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
