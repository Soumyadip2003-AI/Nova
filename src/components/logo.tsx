"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
    size?: number;
    showText?: boolean;
    className?: string;
    /** Kept for existing callers; the proofread mark has no hover glow. */
    hover?: boolean;
    withContainer?: boolean;
    containerClassName?: string;
    /** Gently pulses the mark while Nova is working. */
    pulse?: boolean;
}

/** The Nova mark: an ink tile with a highlighter "N". */
const Mark = ({ size, pulse }: { size: number; pulse?: boolean }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 28 28"
        aria-hidden="true"
        className={cn("shrink-0", pulse && "animate-pulse")}
    >
        <rect x="2" y="2" width="24" height="24" rx="7" className="fill-[#13213a] dark:fill-[#f5e663]" />
        <path
            d="M9 19V9l10 10V9"
            fill="none"
            className="stroke-[#f5e663] dark:stroke-[#13213a]"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

export const Logo = ({
    size = 24,
    showText = false,
    className,
    withContainer = false,
    containerClassName,
    pulse = false,
}: LogoProps) => {
    const mark = withContainer ? (
        <span className={cn("flex items-center justify-center", containerClassName)}>
            <Mark size={size} pulse={pulse} />
        </span>
    ) : (
        <Mark size={size} pulse={pulse} />
    );

    return (
        <span className={cn("flex items-center gap-2", className)}>
            {mark}
            {showText ? (
                <span
                    className={cn(
                        "font-display font-bold tracking-tight text-foreground",
                        size >= 24 ? "text-xl" : "text-base",
                    )}
                >
                    Nova
                </span>
            ) : (
                <span className="sr-only">Nova</span>
            )}
        </span>
    );
};
