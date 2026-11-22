"use client";

import { AlertCircleIcon, HomeIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Project page error:", error);
  }, [error]);

  return (
    <main className="bg-grid flex min-h-dvh items-center justify-center bg-background px-4 py-12">
      <div
        role="alert"
        className="w-full max-w-md rounded-2xl border-[1.5px] border-foreground bg-card p-6 shadow-stamp sm:p-8"
      >
        <p className="flex items-center gap-2 text-sm font-medium text-destructive">
          <AlertCircleIcon className="size-4" aria-hidden />
          Could not open this project
        </p>
        <h1 className="mt-3 font-display text-2xl font-bold text-balance">
          Something went wrong
        </h1>
        <p className="mt-2 text-muted-foreground text-pretty">
          The project may still be getting ready. Wait a few seconds, then try again.
        </p>

        {error.message && (
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer rounded-md text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Technical details
            </summary>
            <p className="mt-2 rounded-[10px] bg-destructive-soft p-3 font-mono text-xs break-words text-foreground">
              {error.message}
            </p>
          </details>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={reset}
            className="h-10 gap-2 rounded-[10px] px-4 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <RefreshCwIcon className="size-4" aria-hidden />
            Try again
          </Button>
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="h-10 gap-2 rounded-[10px] border-[1.5px] border-foreground bg-card px-4 shadow-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <HomeIcon className="size-4" aria-hidden />
            Go to my projects
          </Button>
        </div>
      </div>
    </main>
  );
}
