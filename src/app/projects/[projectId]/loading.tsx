import { Loader2Icon } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="relative">
        {/* Animated gradient ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 opacity-20 blur-xl animate-pulse" />

        {/* Spinner */}
        <Loader2Icon className="size-12 text-amber-500 animate-spin relative z-10" />
      </div>

      <div className="text-center space-y-2">
        <p className="text-lg font-medium bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent">
          Setting up your project
        </p>
        <p className="text-sm text-muted-foreground">
          This will only take a moment...
        </p>
      </div>
    </div>
  );
}
