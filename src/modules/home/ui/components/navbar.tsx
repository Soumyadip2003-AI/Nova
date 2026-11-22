"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { UserControl } from "@/components/user-control";
import { Logo } from "@/components/logo";

const linkClass =
    "rounded-[10px] px-1 text-[15px] text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export const Navbar = () => {
    return (
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-5 sm:px-8">
            <Link
                href="/"
                className="rounded-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                <Logo size={28} showText />
            </Link>
            <nav aria-label="Main" className="flex items-center gap-3 sm:gap-6">
                <Link href="/#how-it-works" className={`${linkClass} hidden md:inline`}>
                    How it works
                </Link>
                <Link href="/pricing" className={linkClass}>
                    Pricing
                </Link>
                <SignedOut>
                    <SignInButton>
                        <button type="button" className={linkClass}>
                            Sign in
                        </button>
                    </SignInButton>
                    <SignUpButton>
                        <Button className="h-11 rounded-[10px] px-4 text-[15px] sm:px-5 font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                            Start free
                        </Button>
                    </SignUpButton>
                </SignedOut>
                <SignedIn>
                    <UserControl showName />
                </SignedIn>
            </nav>
        </header>
    );
};
