"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { MessagesContainer } from "../components/messages-container";
import { Suspense, useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Fragment } from "@/generated/prisma";
import { ProjectHeader } from "../components/project-header";
import { FragmentWeb } from "../components/fragment-web";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EyeIcon, CodeIcon } from "lucide-react";
import { FileExplorer } from "@/components/file-explorer";
import { UserControl } from "@/components/user-control";

interface Props {
    projectId: string;
}

// Loading skeleton for messages
const MessagesLoadingSkeleton = () => (
    <div className="flex h-full flex-col gap-4 p-5" role="status">
        <span className="sr-only">Loading the chat</span>
        <div className="ml-auto h-12 w-3/4 animate-pulse rounded-xl bg-muted" />
        <div className="h-36 w-full animate-pulse rounded-xl bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded-[10px] bg-muted" />
    </div>
);

// Loading skeleton for header
const HeaderLoadingSkeleton = () => (
    <div className="flex items-center gap-3" role="status">
        <span className="sr-only">Loading the project</span>
        <div className="size-7 animate-pulse rounded-[10px] bg-muted" />
        <div className="h-5 w-40 animate-pulse rounded-[10px] bg-muted" />
    </div>
);

const EmptyState = ({
    icon: Icon,
    title,
    body,
}: {
    icon: typeof EyeIcon;
    title: string;
    body: string;
}) => (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <span className="mb-5 flex size-12 items-center justify-center rounded-[10px] border-[1.5px] border-foreground bg-background">
            <Icon className="size-5" aria-hidden />
        </span>
        <h2 className="font-display text-xl font-bold text-balance">{title}</h2>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground text-pretty">{body}</p>
    </div>
);

const tabTriggerClass =
    "h-9 flex-none gap-2 rounded-[10px] border-0 px-4 text-sm font-medium text-muted-foreground shadow-none focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-none dark:text-muted-foreground dark:data-[state=active]:bg-card dark:data-[state=active]:text-foreground";

export const ProjectView = ({ projectId }: Props) => {
    const [activeFragment, setActiveFragment] = useState<Fragment | null>(null);
    const [tabState, setTabState] = useState<"preview" | "code">("preview");
    const trpc = useTRPC();
    const isMobile = useIsMobile();

    // Ensure project exists and is hydrated from server prefetch
    useSuspenseQuery({
        ...trpc.projects.getOne.queryOptions({
            id: projectId,
        }),
        staleTime: 5 * 60 * 1000,
    });

    return (
        <div className="flex h-dvh flex-col bg-background text-foreground">
            {/* Workspace header */}
            <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b-[1.5px] border-foreground bg-card px-3 sm:px-5">
                <Suspense fallback={<HeaderLoadingSkeleton />}>
                    <ProjectHeader projectId={projectId} />
                </Suspense>

                <div className="flex shrink-0 items-center gap-2">
                    <UserControl />
                </div>
            </header>

            <main className="flex min-h-0 flex-1">
            {/* Phones stack chat above preview; wider screens sit them side by side */}
            <ResizablePanelGroup
                key={isMobile ? "vertical" : "horizontal"}
                direction={isMobile ? "vertical" : "horizontal"}
                className="min-h-0 flex-1"
            >
                {/* Left panel: chat */}
                <ResizablePanel
                    defaultSize={isMobile ? 55 : 35}
                    minSize={25}
                    maxSize={isMobile ? 75 : 50}
                    className="flex min-h-0 flex-col bg-card"
                >
                    <section aria-label="Chat" className="flex h-full min-h-0 flex-col">
                        <Suspense fallback={<MessagesLoadingSkeleton />}>
                            <MessagesContainer
                                projectId={projectId}
                                activeFragment={activeFragment}
                                setActiveFragment={setActiveFragment}
                            />
                        </Suspense>
                    </section>
                </ResizablePanel>

                <ResizableHandle
                    withHandle
                    className="w-[1.5px] bg-foreground focus-visible:ring-2 focus-visible:ring-ring data-[panel-group-direction=vertical]:h-[1.5px] data-[panel-group-direction=vertical]:w-full"
                />

                {/* Right panel: preview and code */}
                <ResizablePanel
                    defaultSize={isMobile ? 45 : 65}
                    minSize={isMobile ? 25 : 50}
                >
                    <Tabs
                        className="flex h-full min-h-0 flex-col gap-3 p-3 sm:px-5 sm:pt-4 sm:pb-5"
                        defaultValue="preview"
                        value={tabState}
                        onValueChange={(value) => setTabState(value as "preview" | "code")}
                    >
                        <TabsList
                            aria-label="View"
                            className="h-auto gap-1 rounded-[10px] bg-muted p-1"
                        >
                            <TabsTrigger value="preview" className={tabTriggerClass}>
                                <EyeIcon className="size-4" aria-hidden />
                                Preview
                            </TabsTrigger>
                            <TabsTrigger value="code" className={tabTriggerClass}>
                                <CodeIcon className="size-4" aria-hidden />
                                Code
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent
                            value="preview"
                            className="m-0 min-h-0 flex-1 overflow-hidden rounded-2xl border-[1.5px] border-foreground bg-card data-[state=inactive]:hidden"
                        >
                            {activeFragment ? (
                                <FragmentWeb data={activeFragment} />
                            ) : (
                                <EmptyState
                                    icon={EyeIcon}
                                    title="No preview yet"
                                    body="Tell Nova what to build in the chat. Your app shows up here when it is ready."
                                />
                            )}
                        </TabsContent>

                        <TabsContent
                            value="code"
                            className="m-0 min-h-0 flex-1 overflow-hidden rounded-2xl border-[1.5px] border-foreground bg-card data-[state=inactive]:hidden"
                        >
                            {activeFragment?.files ? (
                                <FileExplorer
                                    files={activeFragment.files as { [path: string]: string }}
                                />
                            ) : (
                                <EmptyState
                                    icon={CodeIcon}
                                    title="No code yet"
                                    body="The files Nova writes for your app show up here. You never have to edit them."
                                />
                            )}
                        </TabsContent>
                    </Tabs>
                </ResizablePanel>
            </ResizablePanelGroup>
            </main>
        </div>
    );
};
