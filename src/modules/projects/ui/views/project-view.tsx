"use client";

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { MessagesContainer } from "../components/messages-container";
import { Suspense, useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Fragment } from "@/generated/prisma";
import { ProjectHeader } from "../components/project-header";
import { FragmentWeb } from "../components/fragment-web";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EyeIcon, CodeIcon, CrownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileExplorer } from "@/components/file-explorer";
import { cn } from "@/lib/utils";

interface Props {
    projectId: string;
}

// Loading skeleton for messages
const MessagesLoadingSkeleton = () => (
    <div className="flex flex-col h-full">
        <div className="flex-1 p-4 space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="size-8 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded-lg w-24" />
                        <div className="h-16 bg-muted rounded-2xl w-3/4" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// Loading skeleton for header
const HeaderLoadingSkeleton = () => (
    <div className="p-3 flex items-center gap-3 border-b animate-pulse">
        <div className="size-8 rounded-lg bg-muted" />
        <div className="h-5 bg-muted rounded-lg w-32" />
    </div>
);

// Empty state for preview
const EmptyPreviewState = () => (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-muted/30 to-muted/10">
        <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-3xl blur-2xl" />
            <div className="relative size-20 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center border border-amber-200/50 dark:border-amber-500/20">
                <EyeIcon className="size-8 text-amber-500" />
            </div>
        </div>
        <h3 className="text-xl font-semibold mb-2">No Preview Yet</h3>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
            Start a conversation and Nova will generate a preview for you to see here.
        </p>
    </div>
);

export const ProjectView = ({ projectId }: Props) => {
    const [activeFragment, setActiveFragment] = useState<Fragment | null>(null);
    const [tabState, setTabState] = useState<"preview" | "code">("preview");
    const trpc = useTRPC();
    const { data: project } = useSuspenseQuery({
        ...trpc.projects.getOne.queryOptions({
            id: projectId,
        }),
        staleTime: 5 * 60 * 1000,
    });

    return (
        <div className="h-screen bg-background">
            <ResizablePanelGroup direction="horizontal">
                {/* Left Panel - Messages */}
                <ResizablePanel
                    defaultSize={35}
                    minSize={25}
                    maxSize={50}
                    className="flex flex-col min-h-0"
                >
                    {/* Gradient background for left panel */}
                    <div className="flex flex-col h-full bg-gradient-to-b from-background via-background to-muted/20 relative">
                        {/* Subtle pattern overlay */}
                        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

                        <div className="relative z-10 flex flex-col h-full">
                            <Suspense fallback={<HeaderLoadingSkeleton />}>
                                <ProjectHeader projectId={projectId} />
                            </Suspense>
                            <Suspense fallback={<MessagesLoadingSkeleton />}>
                                <MessagesContainer
                                    projectId={projectId}
                                    activeFragment={activeFragment}
                                    setActiveFragment={setActiveFragment}
                                />
                            </Suspense>
                        </div>
                    </div>
                </ResizablePanel>

                {/* Resizable Handle */}
                <ResizableHandle
                    withHandle
                    className="bg-border/50 hover:bg-amber-500/20 transition-colors data-[resize-handle-active]:bg-amber-500/30"
                />

                {/* Right Panel - Preview/Code */}
                <ResizablePanel
                    defaultSize={65}
                    minSize={50}
                >
                    <Tabs
                        className="h-full flex flex-col"
                        defaultValue="preview"
                        value={tabState}
                        onValueChange={(value) => setTabState(value as "preview" | "code")}
                    >
                        {/* Tab Header */}
                        <div className="flex items-center justify-between p-3 border-b bg-card/50 backdrop-blur-sm">
                            <TabsList className="h-9 p-1 bg-muted/50 rounded-xl">
                                <TabsTrigger
                                    value="preview"
                                    className={cn(
                                        "rounded-lg gap-2 px-4 transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm",
                                        "data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400"
                                    )}
                                >
                                    <EyeIcon className="size-4" />
                                    <span className="font-medium">Demo</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="code"
                                    className={cn(
                                        "rounded-lg gap-2 px-4 transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm",
                                        "data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400"
                                    )}
                                >
                                    <CodeIcon className="size-4" />
                                    <span className="font-medium">Code</span>
                                </TabsTrigger>
                            </TabsList>

                            {/* Upgrade Button */}
                            <Button
                                asChild
                                size="sm"
                                className={cn(
                                    "rounded-xl gap-2 px-4 transition-all",
                                    "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600",
                                    "text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30"
                                )}
                            >
                                <Link href="/pricing">
                                    <CrownIcon className="size-4" />
                                    <span>Upgrade</span>
                                </Link>
                            </Button>
                        </div>

                        {/* Tab Content */}
                        <TabsContent value="preview" className="flex-1 m-0 data-[state=inactive]:hidden">
                            {activeFragment ? (
                                <FragmentWeb data={activeFragment} />
                            ) : (
                                <EmptyPreviewState />
                            )}
                        </TabsContent>

                        <TabsContent value="code" className="flex-1 m-0 min-h-0 data-[state=inactive]:hidden">
                            {activeFragment?.files ? (
                                <FileExplorer
                                    files={activeFragment.files as { [path: string]: string }}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-muted/30 to-muted/10">
                                    <div className="relative mb-6">
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-3xl blur-2xl" />
                                        <div className="relative size-20 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center border border-blue-200/50 dark:border-blue-500/20">
                                            <CodeIcon className="size-8 text-blue-500" />
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">No Code Yet</h3>
                                    <p className="text-sm text-muted-foreground text-center max-w-xs">
                                        Generated code will appear here once Nova creates something for you.
                                    </p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
};
