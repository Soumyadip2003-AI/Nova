import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import TextareaAutosize from "react-textarea-autosize";
import {z} from "zod";
import{toast} from "sonner";
import{useState, useEffect, useCallback} from "react";
import{ArrowUpIcon, Loader2Icon, Square, SparklesIcon} from "lucide-react";
import{useMutation,useQueryClient } from "@tanstack/react-query";
import {cn} from "@/lib/utils";
import{useTRPC} from "@/trpc/client";
import{Button} from "@/components/ui/button";
import{Form, FormField } from "@/components/ui/form";
import { Hint } from "@/components/hint";


interface Props{
    projectId: string;
    isThinking?: boolean;
    onCancelThinking?: () => void;
};
const formSchema = z.object({
    value: z.string()
     .min(1, { message: "Value is required" })
     .max(10000, { message: "Value is too long" }),
})

export const MessageForm = ({projectId, isThinking = false, onCancelThinking}: Props) => {

    const trpc = useTRPC();
    const queryClient=useQueryClient();
    const [isCancelling, setIsCancelling] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            value: "",
        },
    });
    const createMessage=useMutation(trpc.messages.create.mutationOptions({
        onError:(error)=>{
            toast.error(error.message);
            // Re-enable form on error
            form.reset({
                value: ""
            });
        },
    }));

    const onSubmit=async(values: z.infer<typeof formSchema>)=>{
        // Clear the form immediately for instant feedback
        form.reset({
            value: ""
        });

        // Fire the mutation in the background
        createMessage.mutate({
                value:values.value,
                projectId,
        });

        // Invalidate immediately to trigger refetch
        // This ensures we see the user message and thinking message ASAP
        queryClient.invalidateQueries(
            trpc.messages.getMany.queryOptions({
                projectId
            }),
        );
    };

    const handleStopThinking = useCallback(async () => {
        if (isCancelling || !onCancelThinking) return;

        setIsCancelling(true);
        try {
            const response = await fetch('/api/cancel-thinking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId })
            });

            if (response.ok) {
                onCancelThinking();
                toast.success("Task cancelled");
            } else {
                toast.error("Failed to cancel task");
            }
        } catch (error) {
            console.error('Error cancelling:', error);
            toast.error("Failed to cancel task");
        } finally {
            setIsCancelling(false);
        }
    }, [isCancelling, onCancelThinking, projectId]);

    const isButtonDisabeled=!form.formState.isValid && !isThinking;
    const [isFocused, setIsFocused] = useState(false);
    const showUsage= false;

    // Global keyboard shortcut for cancel (works anywhere on the page)
    useEffect(() => {
        if (!isThinking) return;

        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                e.stopPropagation();
                handleStopThinking();
            }
        };

        document.addEventListener('keydown', handleGlobalKeyDown);

        return () => {
            document.removeEventListener('keydown', handleGlobalKeyDown);
        };
    }, [isThinking, handleStopThinking]); // eslint-disable-line react-hooks/exhaustive-deps

    return(
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className={cn(
                    "relative border rounded-2xl bg-card/80 backdrop-blur-sm transition-all duration-200",
                    isFocused
                        ? "shadow-lg shadow-amber-500/5 border-amber-500/30 ring-1 ring-amber-500/20"
                        : "border-border/50 hover:border-border",
                    showUsage && "rounded-t-none",
                )}
                onKeyDown={(e) => {
                    if(e.key === "Enter" && (e.ctrlKey || e.metaKey)){
                        e.preventDefault();
                        e.stopPropagation();
                        if (isThinking) {
                            handleStopThinking();
                        } else {
                            form.handleSubmit(onSubmit)(e);
                        }
                    }
                }}
            >
                {/* Input area */}
                <div className="p-4 pb-2">
                    <FormField
                        control={form.control}
                        name="value"
                        render={({field})=>(
                            <TextareaAutosize
                                minRows={2}
                                maxRows={8}
                                {...field}
                                readOnly={isThinking}
                                className={cn(
                                    "resize-none border-none w-full outline-none bg-transparent text-sm leading-relaxed placeholder:text-muted-foreground/60",
                                    isThinking && "cursor-not-allowed opacity-60"
                                )}
                                onFocus={()=>setIsFocused(true)}
                                onBlur={()=>setIsFocused(false)}
                                placeholder={isThinking ? "Nova is thinking..." : "What would you like to build?"}
                            />
                        )}
                    />
                </div>

                {/* Footer with actions */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-border/30 bg-muted/30 rounded-b-2xl">
                    {/* Keyboard hint */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <kbd className="inline-flex h-5 items-center gap-1 rounded-md border bg-background px-1.5 font-mono text-[10px] font-medium shadow-sm">
                            <span className="text-xs">⌘</span>
                            <span>Enter</span>
                        </kbd>
                        <span>to {isThinking ? "cancel" : "send"}</span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                        {isThinking ? (
                            <Hint text="Stop generating" side="top">
                                <Button
                                    type="button"
                                    onClick={handleStopThinking}
                                    disabled={isCancelling}
                                    size="sm"
                                    className={cn(
                                        "h-9 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white gap-2 transition-all",
                                        isCancelling && "opacity-50"
                                    )}
                                >
                                    {isCancelling ? (
                                        <Loader2Icon className="size-4 animate-spin"/>
                                    ) : (
                                        <>
                                            <Square className="size-3.5" fill="currentColor"/>
                                            <span className="text-xs font-medium">Stop</span>
                                        </>
                                    )}
                                </Button>
                            </Hint>
                        ) : (
                            <Hint text="Send message" side="top">
                                <Button
                                    type="submit"
                                    disabled={isButtonDisabeled}
                                    size="sm"
                                    className={cn(
                                        "h-9 px-4 rounded-xl gap-2 transition-all",
                                        isButtonDisabeled
                                            ? "bg-muted text-muted-foreground border border-border"
                                            : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-amber-500/20"
                                    )}
                                >
                                    <SparklesIcon className="size-3.5"/>
                                    <span className="text-xs font-medium">Send</span>
                                    <ArrowUpIcon className="size-3.5"/>
                                </Button>
                            </Hint>
                        )}
                    </div>
                </div>
            </form>
        </Form>
    );
}