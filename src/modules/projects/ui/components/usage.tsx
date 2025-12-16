"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CrownIcon } from "lucide-react";
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

    return(
        <div className={`rounded-t-xl border border-b-0 p-2.5 ${
            isOutOfCredits
                ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800'
                : isPro
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700'
                    : 'bg-background'
        }`}>
            <div className="flex items-center gap-x-2">
                <div>
                    {isPro && (
                        <div className="flex items-center gap-1 mb-0.5">
                            <CrownIcon className="size-3 text-amber-500" />
                            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Pro</span>
                        </div>
                    )}
                    {isOutOfCredits ? (
                        <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                            You have run out of credits
                        </p>
                    ) : (
                        <p className="text-sm">
                            <span className="font-semibold">{points}</span>
                            {isPro ? "" : " free"} credit{points !== 1 ? 's' : ''} remaining
                            {totalCredits && (
                                <span className="text-muted-foreground"> / {totalCredits}</span>
                            )}
                        </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                        Resets in {formatDuration(
                            intervalToDuration({
                                start: now,
                                end: resetDate,
                            }),
                            {format:["days","hours","minutes","seconds"]}
                        )}
                    </p>
                </div>
                {!isPro && (
                    <Button
                        asChild
                        size="sm"
                        variant="default"
                        className="ml-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-300"
                    >
                        <Link href="/pricing">
                            <CrownIcon className="size-4 mr-1.5" /> Upgrade
                        </Link>
                    </Button>
                )}
            </div>
        </div>
    )
}
