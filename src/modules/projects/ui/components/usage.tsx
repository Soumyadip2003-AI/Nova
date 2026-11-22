"use client";

import Link from "next/link";
import { AlertCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useMemo } from "react";

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
    const resetDate = useMemo(() => new Date(Date.now() + msBeforeNext), [msBeforeNext]);

    // Show the reset as a date: a live seconds counter is noise, and a rounded
    // duration ("2 months") was misleading.
    const resetsOn = format(resetDate, "d MMM");

    return(
        <div
            className={cn(
                "mb-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl px-3.5 py-2.5 text-sm",
                isOutOfCredits ? "bg-destructive-soft" : "bg-muted"
            )}
        >
            {isOutOfCredits ? (
                <p className="flex items-center gap-1.5 font-semibold">
                    <AlertCircleIcon className="size-4 shrink-0 text-destructive" aria-hidden />
                    You have run out of credits
                </p>
            ) : (
                <p className="text-xs font-medium">
                    {isPro && <span className="mr-2 font-bold">Pro</span>}
                    {totalCredits != null ? `${points} of ${totalCredits}` : points}
                    {" "}credit{(totalCredits ?? points) !== 1 ? "s" : ""} left
                </p>
            )}
            <p className="text-xs text-muted-foreground">Resets on {resetsOn}</p>
            {!isPro && (
                <Link
                    href="/pricing"
                    className="ml-auto inline-flex h-8 items-center rounded-full bg-primary px-3.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                    Get more
                </Link>
            )}
        </div>
    )
}
