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
        bottomRef.current?.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        });
    }, [messages.length]);

    const lastMessage = messages[messages.length - 1];
    const isLastMessageUser = lastMessage?.role === "USER";
    const lastThinkingMessage = messages.findLast((msg) => msg.type === "THINKING");

    const handleCancel = useCallback(() => {
        refetch();
    }, [refetch]);

    return (
        <div className="flex flex-col flex-1 min-h-0 bg-card">
            {/* Messages area */}
            <div
                tabIndex={0}
                role="region"
                aria-label="Chat history"
                className="flex-1 min-h-0 overflow-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            >
                <div className="px-4 py-5 sm:px-5">
                    {/* Welcome message when no messages */}
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center px-2 py-16 text-center">
                            <span className="mb-5 flex size-12 items-center justify-center rounded-2xl border border-border bg-card">
                                <MessageCircleIcon className="size-5" aria-hidden />
                            </span>
                            <h2 className="mb-2 text-xl font-bold">Tell Nova what to build</h2>
                            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                                Describe it in plain words. Nova builds it and checks it works before you see it.
                            </p>
                        </div>
                    )}

                    {/* Messages */}
                    <div role="log" aria-live="polite" aria-relevant="additions" aria-label="Chat messages">
                    {messages.map((message) => {
                        if (message.type === "THINKING") return null;

                        return (
                            <MessageCard
                                key={message.id}
                                content={message.content ?? ""}
                                attachments={message.attachments}
                                role={message.role}
                                fragment={message.fragment}
                                createdAt={message.createdAt}
                                isActiveFragment={activeFragment?.id === message.fragment?.id}
                                onFragmentClick={() => setActiveFragment(message.fragment)}
                                type={message.type}
                            />
                        );
                    })}
                    </div>

                    {/* Loading state */}
                    {(isLastMessageUser || lastThinkingMessage) && (
                        <MessageLoading thinking={lastThinkingMessage?.thinking as ThinkingData | null} />
                    )}

                    <div ref={bottomRef} className="h-4" />
                </div>
            </div>

            {/* Input area */}
            <div className="border-t border-border bg-card p-3 sm:px-4 sm:py-3.5">
                <MessageForm
                    projectId={projectId}
                    isThinking={!!lastThinkingMessage}
                    onCancelThinking={handleCancel}
                />
            </div>
        </div>
    );
};
