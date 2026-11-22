"use client";

import { Fragment, MessageRole, MessageType } from "@/generated/prisma";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ChevronRightIcon, Code2Icon, CopyIcon, CheckIcon, AlertCircleIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { MessageAttachments } from "@/components/attachments";

interface UserMessageProps {
    content: string;
    attachments?: unknown;
}

const UserMessage = ({ content, attachments }: UserMessageProps) => {
    return (
        <div className="flex flex-col items-end gap-2 pb-4 pl-10">
            <MessageAttachments attachments={attachments} />
            <div className="max-w-[85%] rounded-[18px] rounded-br-md bg-muted px-3.5 py-2.5 text-foreground">
                <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                    {content}
                </p>
            </div>
        </div>
    );
};

interface FragmentCardProps {
    fragment: Fragment;
    isActiveFragment: boolean;
    onFragmentClick: (fragment: Fragment) => void;
}

const FragmentCard = ({ fragment, isActiveFragment, onFragmentClick }: FragmentCardProps) => {
    return (
        <button
            type="button"
            aria-current={isActiveFragment ? "true" : undefined}
            className={cn(
                "flex w-full items-center gap-3 rounded-2xl border bg-card px-3 py-2.5 text-left transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActiveFragment
                    ? "border-transparent shadow-float ring-2 ring-[var(--nova-violet)]/40"
                    : "border-border hover:bg-muted"
            )}
            onClick={() => onFragmentClick(fragment)}
        >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Code2Icon className="size-4" aria-hidden />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
                <span className="line-clamp-1 text-sm font-semibold">{fragment.title}</span>
                <span className="text-xs text-muted-foreground">
                    {isActiveFragment ? "Showing in the preview" : "Open in the preview"}
                </span>
            </span>
            <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </button>
    );
};

interface AssistantMessageProps {
    content: string;
    fragment: Fragment | null;
    createdAt: Date;
    isActiveFragment: boolean;
    onFragmentClick: (fragment: Fragment) => void;
    type: MessageType;
}

const AssistantMessage = ({
    content,
    fragment,
    createdAt,
    isActiveFragment,
    onFragmentClick,
    type,
}: AssistantMessageProps) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isError = type === "ERROR";

    return (
        <div className="flex flex-col gap-3 pb-5">
            {isError ? (
                <div className="flex items-start gap-2.5 rounded-2xl bg-destructive-soft px-3.5 py-2.5 text-[15px] leading-relaxed">
                    <AlertCircleIcon className="mt-1 size-4 shrink-0 text-destructive" aria-hidden />
                    <p className="min-w-0 break-words">
                        {/* A stop the user asked for is not a failure. */}
                        {!/cancelled/i.test(content ?? "") && <span className="font-semibold">Something went wrong. </span>}
                        {content}
                    </p>
                </div>
            ) : type === "CHAT" ? (
                <div className={cn(
                    "prose prose-sm max-w-none text-[15px] text-foreground",
                    "prose-p:my-2 prose-p:leading-relaxed",
                    "prose-headings:my-3 prose-headings:prose-headings:font-bold prose-headings:text-foreground prose-strong:text-foreground",
                    "prose-li:marker:text-muted-foreground prose-hr:border-border prose-th:border-border prose-td:border-border",
                    "prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5",
                    "prose-pre:bg-muted prose-pre:text-foreground prose-pre:border prose-pre:border-border prose-pre:rounded-xl",
                    "prose-code:font-mono prose-code:font-medium prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none",
                    "prose-a:text-foreground prose-a:underline prose-a:underline-offset-2",
                    "prose-blockquote:border-l-border prose-blockquote:text-muted-foreground",
                )}>
                    <ReactMarkdown>{content}</ReactMarkdown>
                </div>
            ) : (
                <p className="break-words text-[15px] leading-relaxed">{content}</p>
            )}

            {fragment && type === "RESULT" && (
                <FragmentCard
                    fragment={fragment}
                    isActiveFragment={isActiveFragment}
                    onFragmentClick={onFragmentClick}
                />
            )}

            <div className="flex items-center gap-3">
                <time
                    dateTime={new Date(createdAt).toISOString()}
                    className="text-xs text-muted-foreground"
                >
                    {format(new Date(createdAt), "HH:mm, MMM d")}
                </time>
                {type === "CHAT" && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1.5 rounded-full px-2.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={handleCopy}
                    >
                        {copied ? <CheckIcon className="size-3.5" aria-hidden /> : <CopyIcon className="size-3.5" aria-hidden />}
                        <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
                    </Button>
                )}
            </div>
        </div>
    );
};

interface MessageCardProps {
    content: string;
    attachments?: unknown;
    role: MessageRole;
    fragment: Fragment | null;
    createdAt: Date;
    isActiveFragment: boolean;
    onFragmentClick: (fragment: Fragment) => void;
    type: MessageType;
}

export const MessageCard = ({
    content,
    attachments,
    role,
    fragment,
    createdAt,
    isActiveFragment,
    onFragmentClick,
    type,
}: MessageCardProps) => {
    if (role === "ASSISTANT") {
        return (
            <AssistantMessage
                content={content}
                fragment={fragment}
                createdAt={createdAt}
                isActiveFragment={isActiveFragment}
                onFragmentClick={onFragmentClick}
                type={type}
            />
        );
    }

    return <UserMessage content={content} attachments={attachments} />;
};
