"use client";

import { Fragment, MessageRole, MessageType } from "@/generated/prisma";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ChevronRightIcon, Code2Icon, CopyIcon, CheckIcon, AlertCircleIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/hint";
import { useState } from "react";

interface UserMessageProps {
    content: string;
}

const UserMessage = ({ content }: UserMessageProps) => {
    return (
        <div className="flex justify-end pb-4 pr-2 pl-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="relative group max-w-[85%]">
                {/* Glow effect on hover */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Message bubble */}
                <div className="relative rounded-2xl rounded-tr-md bg-gradient-to-br from-primary to-primary/90 text-primary-foreground px-4 py-3 shadow-lg shadow-primary/20">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {content}
                    </p>
                </div>
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
            className={cn(
                "group/fragment relative flex items-center gap-3 rounded-xl w-fit px-4 py-3 transition-all duration-300",
                isActiveFragment
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25"
                    : "bg-card hover:bg-muted/80 border border-border/50 hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5"
            )}
            onClick={() => onFragmentClick(fragment)}
        >
            {/* Icon container */}
            <div className={cn(
                "size-11 rounded-xl flex items-center justify-center transition-all duration-300",
                isActiveFragment
                    ? "bg-white/20"
                    : "bg-gradient-to-br from-amber-500/10 to-orange-500/10 group-hover/fragment:from-amber-500/20 group-hover/fragment:to-orange-500/20"
            )}>
                <Code2Icon className={cn(
                    "size-5 transition-transform duration-300 group-hover/fragment:scale-110",
                    isActiveFragment ? "text-white" : "text-amber-500"
                )} />
            </div>

            {/* Content */}
            <div className="flex flex-col items-start flex-1 min-w-0">
                <span className={cn(
                    "text-sm font-semibold line-clamp-1 transition-colors duration-300",
                    !isActiveFragment && "group-hover/fragment:text-amber-600 dark:group-hover/fragment:text-amber-400"
                )}>
                    {fragment.title}
                </span>
                <span className={cn(
                    "text-xs transition-colors duration-300",
                    isActiveFragment ? "text-white/80" : "text-muted-foreground"
                )}>
                    Click to preview
                </span>
            </div>

            {/* Arrow */}
            <div className={cn(
                "size-8 rounded-full flex items-center justify-center transition-all duration-300",
                isActiveFragment
                    ? "bg-white/20"
                    : "bg-muted group-hover/fragment:bg-amber-500/10"
            )}>
                <ChevronRightIcon className={cn(
                    "size-4 transition-all duration-300 group-hover/fragment:translate-x-0.5",
                    isActiveFragment ? "text-white" : "text-muted-foreground group-hover/fragment:text-amber-500"
                )} />
            </div>
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
        <div className="flex flex-col group pb-4 px-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Avatar and header */}
            <div className="flex items-center gap-3 mb-3">
                {/* Logo with glow effect */}
                {isError ? (
                    <div className="relative">
                        <div className="absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-red-400/30" />
                        <div className="relative size-9 rounded-full flex items-center justify-center ring-2 transition-all duration-300 bg-red-100 dark:bg-red-900/30 ring-red-200/50 dark:ring-red-800/50">
                            <AlertCircleIcon className="size-4 text-red-500" />
                        </div>
                    </div>
                ) : (
                    <Logo size={18} withContainer containerClassName="size-9 p-1.5 rounded-full ring-2" hover />
                )}

                {/* Name and timestamp */}
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "text-sm font-semibold",
                        isError ? "text-red-600 dark:text-red-400" : "text-foreground"
                    )}>
                        Nova
                    </span>
                    {isError && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium">
                            Error
                        </span>
                    )}
                    <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {format(new Date(createdAt), "HH:mm 'on' MMM dd, yyyy")}
                    </span>
                </div>
            </div>

            {/* Message content */}
            <div className="pl-12 flex flex-col gap-y-4">
                {type === "CHAT" ? (
                    <>
                        <div className={cn(
                            "prose prose-sm dark:prose-invert max-w-none",
                            "prose-p:my-2 prose-p:leading-relaxed",
                            "prose-headings:my-3 prose-headings:font-semibold",
                            "prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5",
                            "prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/50 prose-pre:rounded-xl prose-pre:shadow-sm",
                            "prose-code:text-amber-600 dark:prose-code:text-amber-400 prose-code:font-medium prose-code:before:content-none prose-code:after:content-none",
                            "prose-a:text-amber-600 dark:prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline",
                            "prose-blockquote:border-l-amber-500 prose-blockquote:bg-muted/30 prose-blockquote:py-1 prose-blockquote:rounded-r-lg",
                        )}>
                            <ReactMarkdown>{content}</ReactMarkdown>
                        </div>

                        {/* Copy button */}
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Hint text={copied ? "Copied!" : "Copy response"} side="top">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "h-8 gap-2 rounded-lg transition-all duration-200",
                                        copied
                                            ? "text-green-600 dark:text-green-400 bg-green-500/10"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                    )}
                                    onClick={handleCopy}
                                >
                                    {copied ? (
                                        <>
                                            <CheckIcon className="size-3.5" />
                                            <span className="text-xs font-medium">Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <CopyIcon className="size-3.5" />
                                            <span className="text-xs font-medium">Copy</span>
                                        </>
                                    )}
                                </Button>
                            </Hint>
                        </div>
                    </>
                ) : (
                    <p className={cn(
                        "text-sm leading-relaxed",
                        isError && "text-red-600 dark:text-red-400"
                    )}>
                        {content}
                    </p>
                )}

                {/* Fragment card */}
                {fragment && type === "RESULT" && (
                    <FragmentCard
                        fragment={fragment}
                        isActiveFragment={isActiveFragment}
                        onFragmentClick={onFragmentClick}
                    />
                )}
            </div>
        </div>
    );
};

interface MessageCardProps {
    content: string;
    role: MessageRole;
    fragment: Fragment | null;
    createdAt: Date;
    isActiveFragment: boolean;
    onFragmentClick: (fragment: Fragment) => void;
    type: MessageType;
}

export const MessageCard = ({
    content,
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

    return <UserMessage content={content} />;
};
