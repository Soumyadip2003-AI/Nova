import { Fragment, MessageRole, MessageType } from "@/generated/prisma";
import { cn } from "@/lib/utils";
import {format} from "date-fns";
import { ChevronRightIcon, Code2Icon, CopyIcon, CheckIcon, AlertCircleIcon } from "lucide-react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/hint";
import { useState } from "react";

interface UserMessageProps{
    content: string;
}

const UserMessage=({content}: UserMessageProps) =>{
    return(
        <div className="flex justify-end pb-6 pr-2 pl-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="relative group max-w-[85%]">
                {/* Message bubble */}
                <div className="relative rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-3 shadow-sm">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {content}
                    </p>
                </div>
            </div>
        </div>
    );
}

interface FragmentCardProps{
    fragment: Fragment;
    isActiveFragment: boolean;
    onFragmentClick: (fragment:Fragment)=> void;
}

const FragmentCard=({
    fragment,
    isActiveFragment,
    onFragmentClick,
}:FragmentCardProps)=>{
    return(
        <button
            className={cn(
                "group/fragment relative flex items-center gap-3 border rounded-xl w-fit px-4 py-3 transition-all duration-200",
                isActiveFragment
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent shadow-lg shadow-amber-500/20"
                    : "bg-muted/50 hover:bg-muted border-border/50 hover:border-amber-500/30 hover:shadow-md",
            )}
            onClick={()=>onFragmentClick(fragment)}
        >
            {/* Icon container */}
            <div className={cn(
                "size-10 rounded-lg flex items-center justify-center transition-colors",
                isActiveFragment
                    ? "bg-white/20"
                    : "bg-gradient-to-br from-amber-500/10 to-orange-500/10"
            )}>
                <Code2Icon className={cn(
                    "size-5",
                    isActiveFragment ? "text-white" : "text-amber-500"
                )}/>
            </div>

            {/* Content */}
            <div className="flex flex-col items-start flex-1 min-w-0">
                <span className={cn(
                    "text-sm font-semibold line-clamp-1",
                    !isActiveFragment && "group-hover/fragment:text-amber-600 dark:group-hover/fragment:text-amber-400"
                )}>
                    {fragment.title}
                </span>
                <span className={cn(
                    "text-xs",
                    isActiveFragment ? "text-white/70" : "text-muted-foreground"
                )}>
                    Click to preview
                </span>
            </div>

            {/* Arrow */}
            <div className={cn(
                "size-8 rounded-full flex items-center justify-center transition-all",
                isActiveFragment
                    ? "bg-white/20"
                    : "bg-background group-hover/fragment:bg-amber-500/10"
            )}>
                <ChevronRightIcon className={cn(
                    "size-4 transition-transform group-hover/fragment:translate-x-0.5",
                    isActiveFragment ? "text-white" : "text-muted-foreground group-hover/fragment:text-amber-500"
                )}/>
            </div>
        </button>
    )
}

interface AssistantMessageProps{
    content:string;
    fragment: Fragment | null;
    createdAt: Date;
    isActiveFragment: boolean;
    onFragmentClick: (fragment:Fragment)=> void;
    type:MessageType;
};

const AssistantMessage =({
    content,
    fragment,
    createdAt,
    isActiveFragment,
    onFragmentClick,
    type,
}:AssistantMessageProps)=>{
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isError = type === "ERROR";

    return(
        <div className={cn(
            "flex flex-col group pb-6 px-2 animate-in fade-in slide-in-from-bottom-2 duration-300",
        )}>
            {/* Avatar and header */}
            <div className="flex items-center gap-3 mb-3">
                {/* Logo with glow effect */}
                <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400/30 to-orange-500/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className={cn(
                        "relative size-8 rounded-full flex items-center justify-center ring-2 transition-all",
                        isError
                            ? "bg-red-100 dark:bg-red-900/30 ring-red-200 dark:ring-red-800"
                            : "bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 ring-amber-200/50 dark:ring-amber-700/50 group-hover:ring-amber-400/50"
                    )}>
                        {isError ? (
                            <AlertCircleIcon className="size-4 text-red-500" />
                        ) : (
                            <Image
                                src="/logo.svg"
                                width={18}
                                height={18}
                                alt="Nova"
                                className="shrink-0"
                            />
                        )}
                    </div>
                </div>

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
                    <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        {format(createdAt,"HH:mm 'on' MMM dd, yyyy")}
                    </span>
                </div>
            </div>

            {/* Message content */}
            <div className="pl-11 flex flex-col gap-y-4">
                {type === "CHAT" ? (
                    <>
                        <div className={cn(
                            "prose prose-sm dark:prose-invert max-w-none",
                            "prose-p:my-2 prose-p:leading-relaxed",
                            "prose-headings:my-3 prose-headings:font-semibold",
                            "prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5",
                            "prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/50 prose-pre:rounded-xl",
                            "prose-code:text-amber-600 dark:prose-code:text-amber-400 prose-code:font-medium prose-code:before:content-none prose-code:after:content-none",
                            "prose-a:text-amber-600 dark:prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline",
                            "prose-blockquote:border-l-amber-500 prose-blockquote:bg-muted/30 prose-blockquote:py-1 prose-blockquote:rounded-r-lg",
                        )}>
                            <ReactMarkdown>{content}</ReactMarkdown>
                        </div>
                        {/* Copy button */}
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Hint text={copied ? "Copied!" : "Copy response"} side="top">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "h-8 gap-2 rounded-lg transition-all",
                                        copied
                                            ? "text-green-600 dark:text-green-400"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                    onClick={handleCopy}
                                >
                                    {copied ? (
                                        <>
                                            <CheckIcon className="size-4" />
                                            <span className="text-xs font-medium">Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <CopyIcon className="size-4" />
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
    )
}

interface MessageCardProps{
    content:string;
    role :MessageRole;
    fragment: Fragment | null;
    createdAt: Date;
    isActiveFragment: boolean;
    onFragmentClick: (fragment:Fragment)=> void;
    type:MessageType;

};

export const MessageCard=({
    content,
    role ,
    fragment,
    createdAt,
    isActiveFragment,
    onFragmentClick,
    type,
}: MessageCardProps) =>{
    if(role=="ASSISTANT"){
        return(
            <AssistantMessage
              content={content}
              fragment={fragment}
              createdAt={createdAt}
              isActiveFragment={isActiveFragment}
              onFragmentClick={onFragmentClick}
              type={type}

            />
        )
    }

    return(
        <UserMessage content={content}/>
        
        
    );


};