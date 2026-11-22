"use client";

import { Fragment } from "@/generated/prisma";
import { useState } from "react";
import { ExternalLinkIcon, RefreshCcwIcon, CopyIcon, CheckIcon, GlobeIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/hint";

interface Props {
    data: Fragment;
}

const iconButton =
    "size-9 rounded-xl p-0 text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring";

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
                        {data.sandboxUrl}
                    </span>
                </div>

                <Hint text={copied ? "Copied" : "Copy link"} side="bottom">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCopy}
                        disabled={!data.sandboxUrl}
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
                        disabled={!data.sandboxUrl}
                        aria-label="Open in new tab"
                        onClick={() => {
                            if (data.sandboxUrl) {
                                window.open(data.sandboxUrl, "_blank");
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
                {loadError ? (
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
                        {isLoading && (
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
