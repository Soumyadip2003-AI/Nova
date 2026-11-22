"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
    size?: number;
    showText?: boolean;
    className?: string;
    /** Kept for existing callers. */
    hover?: boolean;
    withContainer?: boolean;
    containerClassName?: string;
    /** Spins the ring slowly while Nova is working. */
    pulse?: boolean;
    /** White wordmark, for use on the nova gradient. */
    inverted?: boolean;
}

/** The Nova mark: a ring of the nova gradient. */
const Mark = ({ size, pulse }: { size: number; pulse?: boolean }) => (
    <span
        aria-hidden="true"
        className={cn("relative inline-block shrink-0 rounded-full", pulse && "animate-spin [animation-duration:3s]")}
        style={{
            width: size,
            height: size,
            background: "conic-gradient(from 200deg, #ff6a3d, #ff3d7f, #7c5cff, #1fc8e6, #ff6a3d)",
            WebkitMask: `radial-gradient(circle, transparent ${size * 0.2}px, #000 ${size * 0.2 + 0.5}px)`,
            mask: `radial-gradient(circle, transparent ${size * 0.2}px, #000 ${size * 0.2 + 0.5}px)`,
        }}
    />
);

export const Logo = ({
    size = 24,
    showText = false,
    className,
    withContainer = false,
    containerClassName,
    pulse = false,
    inverted = false,
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
                        "font-bold tracking-[-0.03em]",
                        inverted ? "text-white" : "text-foreground",
                        size >= 24 ? "text-xl" : "text-base",
                    )}
                >
                    nova
                </span>
            ) : (
                <span className="sr-only">Nova</span>
            )}
        </span>
    );
};
