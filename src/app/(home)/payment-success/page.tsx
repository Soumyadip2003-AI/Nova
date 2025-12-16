"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, CheckCircle2Icon } from "lucide-react";

export default function PaymentSuccessPage() {
    const router = useRouter();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

    useEffect(() => {
        // Call upgrade endpoint after successful payment
        const upgradeAccount = async () => {
            try {
                const response = await fetch("/api/upgrade-to-pro", {
                    method: "POST",
                });

                if (response.ok) {
                    setStatus("success");
                    // Redirect to home after 2 seconds
                    setTimeout(() => {
                        router.push("/");
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
    }, [router]);

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-4">
                {status === "loading" && (
                    <>
                        <Loader2Icon className="w-12 h-12 mx-auto animate-spin text-amber-500" />
                        <h1 className="text-2xl font-bold">Activating Pro Plan...</h1>
                        <p className="text-muted-foreground">Please wait while we upgrade your account</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <CheckCircle2Icon className="w-12 h-12 mx-auto text-green-500" />
                        <h1 className="text-2xl font-bold">Welcome to Pro! 🎉</h1>
                        <p className="text-muted-foreground">
                            You now have <span className="font-semibold text-amber-600">100 credits</span> per month
                        </p>
                        <p className="text-sm text-muted-foreground">Redirecting you back...</p>
                    </>
                )}

                {status === "error" && (
                    <>
                        <h1 className="text-2xl font-bold text-red-500">Something went wrong</h1>
                        <p className="text-muted-foreground">Please contact support or try logging out and back in</p>
                    </>
                )}
            </div>
        </div>
    );
}
