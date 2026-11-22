"use client";

import Link from "next/link";
import { AlertCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration, intervalToDuration } from "date-fns";
import { useState, useEffect } from "react";

interface Props{
    points: number;
    msBeforeNext: number;
    plan?: "FREE" | "PRO";
    totalCredits?: number;
};

export const Usage = ({ points, msBeforeNext, plan = "FREE", totalCredits }: Props) => {
    const isOutOfCredits = points <= 0;
    const isPro = plan === "PRO";

    // Calculate the reset date - update when msBeforeNext changes
    const [resetDate, setResetDate] = useState(() => new Date(Date.now() + msBeforeNext));

    // State to force re-render every second for live countdown
    const [now, setNow] = useState(new Date());

    // Update resetDate when msBeforeNext changes (e.g., after refetch)
    useEffect(() => {
        setResetDate(new Date(Date.now() + msBeforeNext));
    }, [msBeforeNext]);

    // Update 'now' every second to make countdown live
    useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const resetsIn = formatDuration(
        intervalToDuration({
            start: now,
            end: resetDate,
        }),
        {format:["days","hours","minutes","seconds"]}
    );

    return(
        <div
            className={cn(
                "mb-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[10px] px-3 py-2 text-sm",
                isOutOfCredits ? "bg-destructive-soft" : "bg-muted"
            )}
        >
            {isOutOfCredits ? (
                <p className="flex items-center gap-1.5 font-semibold">
                    <AlertCircleIcon className="size-4 shrink-0 text-destructive" aria-hidden />
                    You have run out of credits
                </p>
            ) : (
                <p className="font-mono text-xs">
                    {isPro && <span className="mr-2 font-sans font-semibold">Pro</span>}
                    {totalCredits != null ? `${points} of ${totalCredits}` : points}
                    {" "}credit{(totalCredits ?? points) !== 1 ? "s" : ""} left
                </p>
            )}
            <p className="font-mono text-xs text-muted-foreground">Resets in {resetsIn}</p>
            {!isPro && (
                <Link
                    href="/pricing"
                    className="ml-auto inline-flex h-8 items-center rounded-[10px] bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                    Get more
                </Link>
            )}
        </div>
    )
}
