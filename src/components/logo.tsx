"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
    size?: number;
    showText?: boolean;
    className?: string;
    hover?: boolean;
    withContainer?: boolean;
    containerClassName?: string;
    pulse?: boolean;
}

export const Logo = ({
    size = 24,
    showText = false,
    className,
    hover = true,
    withContainer = false,
    containerClassName,
    pulse = false,
}: LogoProps) => {
    const logoImage = (
        <div className="relative">
            <Image
                src="/logo.svg"
                alt="Nova"
                width={size}
                height={size}
                className={cn(
                    "relative z-10 shrink-0 transition-transform duration-300",
                    hover && "group-hover:scale-110"
                )}
            />
            <div
                className={cn(
                    "absolute inset-0 bg-orange-500/0 blur-xl transition-all duration-300 rounded-full scale-150",
                    hover && "group-hover:bg-orange-500/60"
                )}
            />
            {pulse && (
                <div
                    className="absolute inset-0 rounded-full bg-orange-500/20 animate-ping"
                    style={{ animationDuration: '2s' }}
                />
            )}
        </div>
    );

    if (withContainer) {
        return (
            <div className={cn("group flex items-center gap-2", className)}>
                <div className="relative">
                    <div className={cn(
                        "absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl blur-lg opacity-0 transition-opacity duration-300",
                        hover && "group-hover:opacity-40"
                    )} />
                    <div className={cn(
                        "relative rounded-xl flex items-center justify-center transition-all duration-300",
                        "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30",
                        "ring-1 ring-amber-200/50 dark:ring-amber-500/20",
                        hover && "group-hover:ring-amber-500/50 group-hover:scale-105",
                        containerClassName
                    )}>
                        {logoImage}
                    </div>
                </div>
                {showText && (
                    <span
                        className={cn(
                            "font-semibold transition-all duration-300",
                            size >= 24 ? "text-lg" : "text-sm",
                            hover && "group-hover:text-orange-400 group-hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]"
                        )}
                    >
                        Nova
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className={cn("group flex items-center gap-2", className)}>
            {logoImage}
            {showText && (
                <span
                    className={cn(
                        "font-semibold transition-all duration-300",
                        size >= 24 ? "text-lg" : "text-sm",
                        hover && "group-hover:text-orange-400 group-hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]"
                    )}
                >
                    Nova
                </span>
            )}
        </div>
    );
};
