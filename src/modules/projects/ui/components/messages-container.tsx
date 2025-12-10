import { useTRPC} from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { MessageCard } from "./message-card";
import { MessageForm } from "./message-form";
import { useEffect, useRef, useCallback } from "react";
import { Fragment } from "@/generated/prisma";
import { MessageLoading } from "./message-loading";
interface Props {
    projectId: string;
    activeFragment: Fragment| null;
    setActiveFragment:(fragment: Fragment | null)=> void;
    onNewFragment?: (fragment: Fragment) => void;
};

export const MessagesContainer = ({projectId, activeFragment, setActiveFragment, onNewFragment}: Props) => {
    const bottomRef = useRef<HTMLDivElement>(null);
    const lastKnownFragmentIdRef = useRef<string | null>(null);
    const trpc = useTRPC();
    const { data: messages, refetch } = useSuspenseQuery({
        ...trpc.messages.getMany.queryOptions({
            projectId: projectId,
        }),
        // Aggressive polling for real-time updates
        refetchInterval: (query) => {
            const data = query.state.data;
            if (!data) return 500;

            // Check if there's any thinking message or recent user message
            const hasThinking = data.some((msg) => msg.type === "THINKING");
            const lastMessage = data[data.length - 1];
            const isLastMessageUser = lastMessage?.role === "USER";

            // Poll very frequently when expecting updates:
            // - 500ms when there's thinking or waiting for response (super responsive!)
            // - 3s when idle (save resources)
            return (hasThinking || isLastMessageUser) ? 500 : 3000;
        },
        // Refetch on window focus for instant updates when switching back
        refetchOnWindowFocus: true,
        // Keep data fresh
        staleTime: 0,
    });

    // Get messages with fragments to detect new ones
    const messagesWithFragments = messages.filter((msg) => msg.fragment !== null);
    const lastFragmentMessage = messagesWithFragments[messagesWithFragments.length - 1];
    const lastFragmentId = lastFragmentMessage?.fragment?.id ?? null;

    // Auto-select the last fragment when a NEW fragment is created
    useEffect(() => {
        // Only auto-select if:
        // 1. There is a fragment, AND
        // 2. The last fragment ID has changed (new fragment created)
        if (lastFragmentMessage?.fragment && lastFragmentId !== lastKnownFragmentIdRef.current) {
            setActiveFragment(lastFragmentMessage.fragment);
            onNewFragment?.(lastFragmentMessage.fragment);
            lastKnownFragmentIdRef.current = lastFragmentId;
        }
    }, [lastFragmentId, setActiveFragment, onNewFragment, lastFragmentMessage?.fragment]);

    useEffect(()=>{
        bottomRef.current?.scrollIntoView();

    }, [messages.length]);

    const lastMessage = messages[messages.length-1];
    const isLastMessageUser=lastMessage?.role==="USER";

    // Find the last thinking message if exists
    const lastThinkingMessage = messages.findLast((msg) => msg.type === "THINKING");

    // Handle cancel callback
    const handleCancel = useCallback(() => {
        // Refetch messages to update UI after cancellation
        refetch();
    }, [refetch]);

    return (
        <div className="flex flex-col flex-1 min-h-0 bg-gradient-to-b from-background to-muted/20">
            {/* Messages area with custom scrollbar */}
            <div className="flex-1 min-h-0 overflow-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                <div className="py-4 px-2 space-y-2">
                    {/* Welcome message when no messages */}
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="size-16 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center mb-4">
                                <span className="text-2xl">✨</span>
                            </div>
                            <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
                            <p className="text-sm text-muted-foreground max-w-xs">
                                Describe what you want to build and Nova will help you create it.
                            </p>
                        </div>
                    )}

                    {messages.map((message)=>{
                        // Skip THINKING messages from normal display - we'll show them in MessageLoading
                        if (message.type === "THINKING") return null;

                        return (
                            <MessageCard
                              key={message.id}
                              content={message.content ?? ""}
                              role={message.role}
                              fragment={message.fragment}
                              createdAt={message.createAt}
                              isActiveFragment={activeFragment?.id === message.fragment?.id}
                              onFragmentClick={() => setActiveFragment(message.fragment)}
                              type={message.type}
                            />
                        );
                    })}

                    {(isLastMessageUser || lastThinkingMessage) && (
                        <MessageLoading
                            thinking={lastThinkingMessage?.thinking as any}
                        />
                    )}
                    <div ref={bottomRef}/>
                </div>
            </div>

            {/* Input area with elevated design */}
            <div className="relative p-3 pt-0">
                {/* Fade gradient */}
                <div className="absolute -top-8 left-0 right-0 h-8 bg-gradient-to-b from-transparent via-background/50 to-background pointer-events-none"/>
                <MessageForm
                    projectId={projectId}
                    isThinking={!!lastThinkingMessage}
                    onCancelThinking={handleCancel}
                />
            </div>
        </div>
    );
};
