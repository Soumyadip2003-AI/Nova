import Link from "next/link";
import { SITE } from "@/lib/site";

const link = "rounded-full hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export const SiteFooter = () => (
    <footer className="mx-auto mt-auto w-full max-w-[1180px] px-5 pb-10 pt-16 sm:px-8">
        <div className="flex flex-col gap-8 border-t border-border pt-8 text-sm text-muted-foreground sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-xs">
                <span className="flex items-center gap-2 font-bold text-foreground">
                    <span
                        aria-hidden="true"
                        className="size-5 rounded-full [background:conic-gradient(from_200deg,#ff6a3d,#ff3d7f,#7c5cff,#1fc8e6,#ff6a3d)] [mask:radial-gradient(circle,transparent_4px,#000_4.5px)]"
                    />
                    nova
                </span>
                <p className="mt-3 leading-relaxed">Describe an app. Nova builds it, checks it and fixes it.</p>
            </div>
            <nav aria-label="Footer" className="grid grid-cols-2 gap-x-12 gap-y-2 sm:grid-cols-3 sm:gap-x-16">
                <Link href="/how-it-works" className={link}>How it works</Link>
                <Link href="/pricing" className={link}>Pricing</Link>
                <Link href="/#examples" className={link}>Examples</Link>
                <Link href="/terms" className={link}>Terms of Service</Link>
                <Link href="/privacy" className={link}>Privacy Policy</Link>
                <a href={`mailto:${SITE.email}`} className={link}>Contact</a>
            </nav>
        </div>
        <p className="mt-8 text-xs text-muted-foreground">
            © 2026 {SITE.operator}. Nova is operated from {SITE.country}.
        </p>
    </footer>
);
