import { Fragment } from "@/generated/prisma";
import { useState } from "react";
import { ExternalLinkIcon,RefreshCcwIcon } from "lucide-react";
import{Button} from"@/components/ui/button";
import { Hint } from "@/components/ui/hint";

interface Props{
    data: Fragment;
};

export function FragmentWeb({data}: Props){

    const[fragmentKey, setFragmentKey]= useState(0);
    const[copied, setCopied]=useState(false);
    const[loadError, setLoadError]=useState(false);

    const onRefresh =() =>{
        setFragmentKey((prev)=> prev +1);
        setLoadError(false); // Reset error state on refresh
    };

    const handleCopy=()=>{
        navigator.clipboard.writeText(data.sandboxUrl);
        setCopied(true);
        setTimeout(()=> setCopied(false),2000)
    };
    return(
        <div className="flex flex-col h-full w-full">
            <div className="p-2 border-b bg-sidebar flex items-center gap-x-2">
                <Hint text="Refresh" side="bottom" align="start">
                <Button size="sm" variant="outline" onClick={onRefresh}>
                    <RefreshCcwIcon/>
                </Button>
                </Hint>
                <Hint text={copied ? "Copied!" : "Click to copy"} side="bottom">
                <Button size="sm" variant="outline" onClick={handleCopy} disabled={!data.sandboxUrl || copied} className="flex-1 justify-start text-start font-normal">
                   <span className="truncate">
                    {data.sandboxUrl}
                   </span>
                </Button>
                </Hint>
                <Hint text="Open in a new tab" side="bottom" align="start">
                <Button
                size="sm"
                disabled={!data.sandboxUrl}
                onClick={() => {
                    if(!data.sandboxUrl) return;
                    window.open(data.sandboxUrl,"_blank")
                    
                }}
                >
                    <ExternalLinkIcon/>
                     
                </Button>
                </Hint>

            </div>
            {loadError ? (
                <div className="flex flex-col items-center justify-center h-full w-full bg-muted text-muted-foreground p-8">
                    <p className="text-lg font-medium mb-2">Failed to load preview</p>
                    <p className="text-sm mb-4">The sandbox environment could not be loaded</p>
                    <Button onClick={onRefresh} variant="outline" size="sm">
                        <RefreshCcwIcon className="mr-2 h-4 w-4" />
                        Try Again
                    </Button>
                </div>
            ) : (
                <iframe
                key={fragmentKey}
                className="h-full w-full"
                sandbox="allow-forms allow-scripts allow-same-origin"
                loading="lazy"
                src={data.sandboxUrl}
                onError={() => setLoadError(true)}
                title="Code preview"
                />
            )}

        </div>
    )

};