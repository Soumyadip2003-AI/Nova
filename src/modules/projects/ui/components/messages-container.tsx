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
};

export const MessagesContainer = ({projectId, activeFragment,setActiveFragment}: Props) => {
    const bottomRef = useRef<HTMLDivElement>(null);
    const trpc = useTRPC();
    const { data: messages, refetch } = useSuspenseQuery({
        ...trpc.messages.getMany.queryOptions({
            projectId: projectId,
        }),
        // Adaptive polling: 1s when thinking is active, 5s otherwise
        // This provides real-time updates without artificial backend delays
        refetchInterval: (query) => {
            const data = query.state.data;
            if (!data) return 5000;

            // Check if there's any thinking message or recent user message
            const hasThinking = data.some((msg) => msg.type === "THINKING");
            const lastMessage = data[data.length - 1];
            const isLastMessageUser = lastMessage?.role === "USER";

            // Poll every 1 second when:
            // - There's an active thinking message, OR
            // - Last message is from user (expecting AI response)
            return (hasThinking || isLastMessageUser) ? 1000 : 5000;
        },
    });

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
        <div className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 min-h-0 overflow-auto">
                <div className="pt-2 pr-1">
                    {messages.map((message)=>{
                        // Skip THINKING messages from normal display - we'll show them in MessageLoading
                        if (message.type === "THINKING") return null;

                        return (
                            <MessageCard
                              key={message.id}
                              content={message.content}
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
            <div className="relative p-3 pt-1">
                <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-background pointer-events-none"/>
                <MessageForm
                    projectId={projectId}
                    isThinking={!!lastThinkingMessage}
                    onCancelThinking={handleCancel}
                />
            </div>
        </div>
    );
};
