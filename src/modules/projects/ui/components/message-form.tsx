import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import TextareaAutosize from "react-textarea-autosize";
import {z} from "zod";
import{toast} from "sonner";
import{useState, useEffect, useCallback} from "react";
import{ArrowUpIcon, Loader2Icon, Square} from "lucide-react";
import{useMutation,useQueryClient } from "@tanstack/react-query";
import {cn} from "@/lib/utils";
import{useTRPC} from "@/trpc/client";
import{Button} from "@/components/ui/button";
import{Form, FormField } from "@/components/ui/form";


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
        onSuccess:()=>{
            // Reset the form to clear the input
            form.reset({
                value: ""
            });
            queryClient.invalidateQueries(
                trpc.messages.getMany.queryOptions({
                    projectId
                }),
            );
        },
        onError:(error)=>{
            toast.error(error.message);
        },
    }));

    const onSubmit=async(values: z.infer<typeof formSchema>)=>{
        await createMessage.mutateAsync({

                value:values.value,
                projectId,

        });
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

    const isPending=createMessage.isPending;
    const isButtonDisabeled=(isPending||!form.formState.isValid) && !isThinking;
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
                "relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all",
                isFocused && "shadow-xs",
                showUsage && "rounded-t-none",

            )}
            onKeyDown={(e) => {
                // Handle keyboard shortcuts at form level to ensure they work
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
            <FormField
            control={form.control}
            name="value"
            render={({field})=>(
                <TextareaAutosize
                minRows={2}
                maxRows={8}
                {...field}
                disabled={isPending}
                readOnly={isThinking}
                className={cn(
                    "pt-4 resize-none border-none w-full outline-none bg-transparent",
                    isThinking && "cursor-not-allowed opacity-60"
                )}
                onFocus={()=>setIsFocused(true)}
                onBlur={()=>setIsFocused(false)}
                placeholder={isThinking ? "Generating response..." : "What would you like to build"}
                />
            )}
            />
            <div className="flex gap-x-2 items-end justify-between pt-2">
                <div className="text-[10px] text-muted-foreground font-mono">
                    <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">

                        <span>&#8984;</span>Enter
                    </kbd>
                    &nbsp;to {isThinking ? "cancel" : "submit"}

                </div>
                {isThinking ? (
                    <Button
                        type="button"
                        onClick={handleStopThinking}
                        disabled={isCancelling}
                        className={cn(
                            "size-8 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-all",
                            isCancelling && "opacity-50"
                        )}
                        title="Stop generation"
                    >
                        {isCancelling ? (
                            <Loader2Icon className="size-4 animate-spin"/>
                        ) : (
                            <Square className="size-4" fill="currentColor"/>
                        )}
                    </Button>
                ) : (
                    <Button
                        type="submit"
                        disabled={isButtonDisabeled}
                        className={cn(
                            "size-8 rounded-full",
                            isButtonDisabeled &&"bg-muted-foreground border"
                        )}
                    >
                        {isPending ? (
                            <Loader2Icon className="size-4 animate-spin"/>
                        ) : (
                            <ArrowUpIcon/>
                        )}
                    </Button>
                )}

            </div>
            </form>
        </Form>

    );
    
}