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
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 px-4">
      {/* Error Icon */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-red-500 to-rose-500 opacity-20 blur-xl" />
        <div className="relative z-10 p-4 rounded-full bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
          <AlertCircleIcon className="size-12 text-red-500" />
        </div>
      </div>

      {/* Error Message */}
      <div className="text-center space-y-2 max-w-md">
        <h2 className="text-2xl font-bold">Something went wrong</h2>
        <p className="text-muted-foreground">
          We couldn&apos;t load this project. This might be because the project is still being created
          or there was an error.
        </p>
        {error.message && (
          <p className="text-sm text-red-600 dark:text-red-400 font-mono bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
            {error.message}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={reset}
          variant="default"
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
        >
          <RefreshCwIcon className="size-4 mr-2" />
          Try Again
        </Button>
        <Button
          onClick={() => router.push("/")}
          variant="outline"
        >
          <HomeIcon className="size-4 mr-2" />
          Go Home
        </Button>
      </div>
    </div>
  );
}
