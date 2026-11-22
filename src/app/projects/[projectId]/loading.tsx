// Mirrors the workspace layout: header bar, chat on the left, preview card on the right.
export default function Loading() {
  return (
    <div className="flex h-dvh flex-col bg-background" role="status">
      <span className="sr-only">Opening your project</span>

      <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b-[1.5px] border-foreground bg-card px-3 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="size-7 animate-pulse rounded-[10px] bg-muted" />
          <div className="h-5 w-36 animate-pulse rounded-[10px] bg-muted sm:w-48" />
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden h-9 w-44 animate-pulse rounded-[10px] bg-muted md:block" />
          <div className="h-9 w-20 animate-pulse rounded-[10px] bg-muted" />
          <div className="size-8 animate-pulse rounded-[10px] bg-muted" />
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="flex w-full flex-col gap-4 bg-card p-5 md:w-[35%] md:border-r-[1.5px] md:border-foreground">
          <div className="ml-auto h-12 w-3/4 animate-pulse rounded-xl bg-muted" />
          <div className="h-36 w-full animate-pulse rounded-xl bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded-[10px] bg-muted" />
          <div className="mt-auto h-12 w-full animate-pulse rounded-[10px] bg-muted" />
        </div>

        <div className="hidden min-w-0 flex-1 flex-col gap-3 px-5 pt-4 pb-5 md:flex">
          <div className="h-11 w-52 animate-pulse rounded-[10px] bg-muted" />
          <div className="flex-1 rounded-2xl border-[1.5px] border-foreground bg-card" />
        </div>
      </div>
    </div>
  );
}
