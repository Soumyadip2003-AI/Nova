"use client";

import Link from "next/link";
import { SignedIn,SignedOut,SignInButton,SignUpButton } from "@clerk/nextjs";
import{Button} from "@/components/ui/button"
import { UserControl } from "@/components/user-control";
import { Logo } from "@/components/logo";

export const Navbar=() => {
    return(
        <nav className="p-4 bg-transparent fixed top-0 left-0 right-0 z-50 transition-all duration-200 border-b border-transparent">
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