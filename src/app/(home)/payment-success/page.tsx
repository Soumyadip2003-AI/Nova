"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, CheckCircle2Icon, AlertCircleIcon } from "lucide-react";

export default function PaymentSuccessPage() {
    const router = useRouter();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

    useEffect(() => {
        // Call upgrade endpoint after successful payment
        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        let attempts = 0;
        const maxAttempts = 5;

        const upgradeAccount = async () => {
            try {
                attempts += 1;
                const response = await fetch("/api/upgrade-to-pro", {
                    method: "POST",
                });

                if (response.ok) {
                    setStatus("success");
                    // Redirect to home after 2 seconds
                    timeoutId = setTimeout(() => {
                        router.push("/");
                    }, 2000);
                } else if (response.status === 403 && attempts < maxAttempts) {
                    timeoutId = setTimeout(() => {
                        upgradeAccount();
                    }, 2000);
                } else {
                    setStatus("error");
                }
            } catch (error) {
                console.error("Upgrade failed:", error);
                setStatus("error");
            }
        };

        upgradeAccount();

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [router]);

    return (
        <div className="flex flex-1 items-center justify-center px-4 py-12">
            <div
                role="status"
                aria-live="polite"
                className="w-full max-w-md rounded-2xl border-[1.5px] border-foreground bg-card p-6 text-card-foreground sm:p-8 shadow-stamp"
            >
                {status === "loading" && (
                    <>
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2Icon aria-hidden className="size-4 animate-spin" />
                            Working on it
                        </p>
                        <h1 className="mt-3 font-display text-3xl font-bold tracking-[-0.02em]">
                            Turning on Pro
                        </h1>
                        <p className="mt-2 text-muted-foreground">
                            We are adding Pro to your account. This takes a few seconds.
                        </p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <p className="inline-flex items-center gap-2 rounded-[10px] bg-success-soft px-2.5 py-1 text-sm font-medium text-success-strong">
                            <CheckCircle2Icon aria-hidden className="size-4" />
                            Pro is on
                        </p>
                        <h1 className="mt-3 font-display text-3xl font-bold tracking-[-0.02em]">
                            Welcome to <span className="mark-highlight">Pro</span>
                        </h1>
                        <p className="mt-2 text-muted-foreground">
                            You now have <span className="font-mono text-foreground">100</span> credits every month.
                        </p>
                        <p className="mt-6 text-sm text-muted-foreground">Taking you back to the home page.</p>
                    </>
                )}

                {status === "error" && (
                    <>
                        <p className="inline-flex items-center gap-2 rounded-[10px] bg-destructive-soft px-2.5 py-1 text-sm font-medium text-foreground">
                            <AlertCircleIcon aria-hidden className="size-4 text-destructive" />
                            Not finished
                        </p>
                        <h1 className="mt-3 font-display text-3xl font-bold tracking-[-0.02em]">
                            Something went wrong
                        </h1>
                        <p className="mt-2 text-muted-foreground">
                            Sign out and sign back in. If Pro is still not on, wait a minute and reload this page.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
