"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { MessageCard } from "./message-card";
import { MessageForm } from "./message-form";
import { useEffect, useRef, useCallback } from "react";
import { Fragment } from "@/generated/prisma";
import { MessageLoading, ThinkingData } from "./message-loading";
import { MessageCircleIcon } from "lucide-react";

interface Props {
    projectId: string;
    activeFragment: Fragment | null;
    setActiveFragment: (fragment: Fragment | null) => void;
    onNewFragment?: (fragment: Fragment) => void;
}

export const MessagesContainer = ({ projectId, activeFragment, setActiveFragment, onNewFragment }: Props) => {
    const bottomRef = useRef<HTMLDivElement>(null);
    const lastKnownFragmentIdRef = useRef<string | null>(null);
    const trpc = useTRPC();

    const { data: messages, refetch } = useSuspenseQuery({
        ...trpc.messages.getMany.queryOptions({
            projectId: projectId,
        }),
        refetchInterval: (query) => {
            const data = query.state.data;
            if (!data) return 500;
            const hasThinking = data.some((msg) => msg.type === "THINKING");
            const lastMessage = data[data.length - 1];
            const isLastMessageUser = lastMessage?.role === "USER";
            return (hasThinking || isLastMessageUser) ? 500 : 3000;
        },
        refetchOnWindowFocus: true,
        staleTime: 0,
    });

    const messagesWithFragments = messages.filter((msg) => msg.fragment !== null);
    const lastFragmentMessage = messagesWithFragments[messagesWithFragments.length - 1];
    const lastFragmentId = lastFragmentMessage?.fragment?.id ?? null;

    useEffect(() => {
        if (lastFragmentMessage?.fragment && lastFragmentId !== lastKnownFragmentIdRef.current) {
            setActiveFragment(lastFragmentMessage.fragment);
            onNewFragment?.(lastFragmentMessage.fragment);
            lastKnownFragmentIdRef.current = lastFragmentId;
        }
    }, [lastFragmentId, setActiveFragment, onNewFragment, lastFragmentMessage?.fragment]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages.length]);

    const lastMessage = messages[messages.length - 1];
    const isLastMessageUser = lastMessage?.role === "USER";
    const lastThinkingMessage = messages.findLast((msg) => msg.type === "THINKING");

    const handleCancel = useCallback(() => {
        refetch();
    }, [refetch]);

    return (
        <div className="flex flex-col flex-1 min-h-0">
            {/* Messages area */}
            <div className="flex-1 min-h-0 overflow-auto scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent hover:scrollbar-thumb-border">
                <div className="py-6 px-3 space-y-1">
                    {/* Welcome message when no messages */}
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Icon with glow */}
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/30 to-orange-500/30 rounded-3xl blur-2xl" />
                                <div className="relative size-20 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center border border-amber-200/50 dark:border-amber-500/20 shadow-xl">
                                    <MessageCircleIcon className="size-9 text-amber-500" />
                                </div>
                            </div>

                            {/* Text content */}
                            <h3 className="text-xl font-semibold mb-2">Start a conversation</h3>
                            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-6">
                                Describe what you want to build and Nova will help you create it instantly.
                            </p>

                            {/* Feature badges */}
                            <div className="flex flex-wrap justify-center gap-2">
                                {["React Apps", "Landing Pages", "Dashboards", "UI Components"].map((feature) => (
                                    <div
                                        key={feature}
                                        className="px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 text-xs text-muted-foreground"
                                    >
                                        {feature}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Messages */}
                    {messages.map((message) => {
                        if (message.type === "THINKING") return null;

                        return (
                            <MessageCard
                                key={message.id}
                                content={message.content ?? ""}
                                role={message.role}
                                fragment={message.fragment}
                                createdAt={message.createdAt}
                                isActiveFragment={activeFragment?.id === message.fragment?.id}
                                onFragmentClick={() => setActiveFragment(message.fragment)}
                                type={message.type}
                            />
                        );
                    })}

                    {/* Loading state */}
                    {(isLastMessageUser || lastThinkingMessage) && (
                        <MessageLoading thinking={lastThinkingMessage?.thinking as ThinkingData | null} />
                    )}

                    <div ref={bottomRef} className="h-4" />
                </div>
            </div>

            {/* Input area */}
            <div className="relative p-3 pt-0">
                {/* Fade gradient overlay */}
                <div className="absolute -top-12 left-0 right-0 h-12 bg-gradient-to-b from-transparent via-background/80 to-background pointer-events-none" />

                <MessageForm
                    projectId={projectId}
                    isThinking={!!lastThinkingMessage}
                    onCancelThinking={handleCancel}
                />
            </div>
        </div>
    );
};
