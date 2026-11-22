"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import { UserControl } from "@/components/user-control";
import { Logo } from "@/components/logo";

const linkClass =
    "rounded-full px-2 py-1 text-[15px] font-medium text-white/90 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";

export const Navbar = () => {
    return (
        <header className="mx-auto flex h-[76px] w-full max-w-[1180px] items-center gap-2 px-5 sm:gap-6 sm:px-8">
            <Link
                href="/"
                className="mr-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:mr-4"
            >
                <Logo size={24} showText inverted />
            </Link>
            <nav aria-label="Main" className="flex flex-1 items-center gap-1 sm:gap-4">
                <Link href="/#examples" className={`${linkClass} hidden md:inline`}>
                    Examples
                </Link>
                <Link href="/#how-it-works" className={`${linkClass} hidden md:inline`}>
                    How it works
                </Link>
                <Link href="/pricing" className={linkClass}>
                    Pricing
                </Link>
                <span className="flex-1" />
                <SignedOut>
                    <SignInButton>
                        <button type="button" className={`${linkClass} hidden sm:inline`}>
                            Sign in
                        </button>
                    </SignInButton>
                    <SignUpButton>
                        <button
                            type="button"
                            className="inline-flex h-10 items-center rounded-full bg-white px-4 text-[15px] font-bold text-[#0b1b33] shadow-sm transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#ff3d7f] sm:px-5"
                        >
                            Start building
                        </button>
                    </SignUpButton>
                </SignedOut>
                <SignedIn>
                    <UserControl showName inverted />
                </SignedIn>
            </nav>
        </header>
    );
};
