interface Props {
    children: React.ReactNode;
}

const Layout = ({ children }: Props) => {
    return (
        <main className="relative flex flex-col min-h-screen overflow-x-hidden">
            {/* Animated mesh gradient background */}
            <div className="fixed inset-0 -z-10">
                {/* Base gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-black" />

                {/* Dot pattern overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:20px_20px] opacity-70" />

                {/* Animated gradient orbs */}
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-r from-violet-200/40 to-pink-200/40 dark:from-violet-500/10 dark:to-pink-500/10 rounded-full blur-3xl animate-blob" />
                <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-gradient-to-r from-amber-200/40 to-orange-200/40 dark:from-amber-500/10 dark:to-orange-500/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
                <div className="absolute bottom-1/4 left-1/3 w-[550px] h-[550px] bg-gradient-to-r from-cyan-200/30 to-blue-200/30 dark:from-cyan-500/10 dark:to-blue-500/10 rounded-full blur-3xl animate-blob animation-delay-4000" />

                {/* Subtle noise texture */}
                <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col px-4 pb-4">
                {children}
            </div>
        </main>
    );
};

export default Layout;