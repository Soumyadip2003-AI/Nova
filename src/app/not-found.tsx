import Link from "next/link";

export default function NotFound() {
    return (
        <main className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 text-center">
            <div aria-hidden="true" className="bg-nova absolute inset-x-[-20%] top-[-40%] -z-10 h-[70%] -skew-y-[8deg]" />
            <p className="text-sm font-bold text-white/90">404</p>
            <h1 className="mt-2 text-4xl font-bold tracking-[-0.04em] text-white sm:text-5xl">This page does not exist.</h1>
            <p className="mt-3 max-w-md text-lg font-medium text-white/90">
                The link may be old, or the project may have been deleted.
            </p>
            <Link
                href="/"
                className="mt-8 inline-flex h-12 items-center rounded-full bg-white px-6 text-[15px] font-bold text-[#0b1b33] shadow-float focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                Back to Nova
            </Link>
        </main>
    );
}
