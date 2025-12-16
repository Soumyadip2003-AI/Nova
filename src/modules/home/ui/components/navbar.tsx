"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { UserControl } from "@/components/user-control";
import { Logo } from "@/components/logo";
import { useScroll } from "@/hooks/use-scroll";
import { cn } from "@/lib/utils";

export const Navbar = () => {
    const isScrolled = useScroll(10);

    return (
        <nav
            className={cn(
                "p-4 fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                isScrolled
                    ? "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50 shadow-sm"
                    : "bg-transparent border-b border-transparent"
            )}
        >
            <div className="max-w-5xl mx-auto w-full flex justify-between items-center">
                <Link href="/" className="flex items-center">
                    <Logo size={20} showText hover withContainer containerClassName="size-10 p-2 rounded-lg" />
                </Link>
                <SignedOut>
                    <div className="flex gap-2">
                        <SignUpButton>
                            <Button variant="outline" size="sm">
                                Sign Up

                            </Button>
                        </SignUpButton>
                        <SignInButton>
                            <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                                Sign In

                            </Button>
                        </SignInButton>

                    </div>
                </SignedOut>
                <SignedIn>
                   <UserControl showName/>
                </SignedIn>
            </div>

        </nav>
    )
}