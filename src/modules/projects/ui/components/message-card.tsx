import { Card } from "@/components/ui/card";
import { Fragment, MessageRole, MessageType } from "@/generated/prisma";
import { cn } from "@/lib/utils";
import {format} from "date-fns";
import { ChevronRightIcon, Code2Icon, CopyIcon, CheckIcon } from "lucide-react";
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
        <div className="flex justify-end pb-4 pr-2 pl-10">
            <Card className="rounded-lg bg-muted p-3 shadow-none border-none max-w-[80%] break-word">
                {content}
            </Card>

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
            "flex items-start text-start gap-2 border rounded-lg bg-muted w-fit p-3 hover:bg-secondary transition-colors",
            isActiveFragment && "bg-primary text-primary-foreground border-primary hover:bg-primary",
        )}
        onClick={()=>onFragmentClick(fragment)}
        
        >
            <Code2Icon className="size-4 mt-0.5"/>
            <div className="flex flex-col flex-1">
                <span className="text-sm font-medium line-clamp-1">
                    {fragment.title}
                </span>
                <span className="text-xs">
                    Preview
                </span>
            </div>
            <div className="flex items-center justify-center mt-0.5">
                <ChevronRightIcon className="size-4"/>
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

    return(
        <div className={cn(

            "flex flex-col group px-2 pb-4",
            type=="ERROR" && " text-red-700 dark:text-red-500",
        )}>
            <div className="flex items-center gap-2 pl-2 mb-2">
                <Image
                src="/logo.svg"
                width={18}
                height={18}
                alt="Vibe"
                className="shrink-0"

                />
                <span className="text-sm font-medium">Vibe</span>
                <span className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                    {format(createdAt,"HH:mm 'on' MMM dd, yyyy")}
                </span>

            </div>
            <div className="pl-8 flex flex-col gap-y-4">
                {type === "CHAT" ? (
                    <>
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-li:my-0 prose-pre:bg-muted prose-pre:border prose-code:text-primary">
                            <ReactMarkdown>{content}</ReactMarkdown>
                        </div>
                        <div className="flex items-center gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Hint text={copied ? "Copied!" : "Copy"} side="top">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 gap-1.5"
                                    onClick={handleCopy}
                                >
                                    {copied ? (
                                        <>
                                            <CheckIcon className="h-3.5 w-3.5 text-green-500" />
                                            <span className="text-xs text-green-500">Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <CopyIcon className="h-3.5 w-3.5" />
                                            <span className="text-xs">Copy</span>
                                        </>
                                    )}
                                </Button>
                            </Hint>
                        </div>
                    </>
                ) : (
                    <span>{content}</span>
                )}
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