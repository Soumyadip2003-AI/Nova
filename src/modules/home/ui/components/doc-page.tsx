import { cn } from "@/lib/utils";

/** Long-form page (guides, legal): title on the colour band, text on a white sheet. */
export const DocPage = ({
    title,
    intro,
    meta,
    children,
    className,
}: {
    title: string;
    intro?: string;
    meta?: string;
    children: React.ReactNode;
    className?: string;
}) => (
    <div className="mx-auto w-full max-w-[880px] px-5 sm:px-8">
        <header className="pt-8 text-white sm:pt-14">
            <h1 className="text-[40px] font-bold leading-[1.02] tracking-[-0.045em] text-balance sm:text-[60px]">{title}</h1>
            {intro && <p className="mt-4 max-w-[620px] text-lg font-medium leading-relaxed text-white/90">{intro}</p>}
            {meta && <p className="mt-4 text-sm font-medium text-white/85">{meta}</p>}
        </header>
        <article
            className={cn(
                "mt-10 rounded-[24px] bg-card px-6 py-8 text-[15.5px] leading-[1.75] text-muted-foreground shadow-float sm:px-12 sm:py-12",
                "[&_h2]:mt-10 [&_h2]:scroll-mt-6 [&_h2]:text-[22px] [&_h2]:font-bold [&_h2]:leading-tight [&_h2]:tracking-[-0.02em] [&_h2]:text-foreground first:[&_h2]:mt-0",
                "[&_h3]:mt-6 [&_h3]:text-[17px] [&_h3]:font-bold [&_h3]:text-foreground",
                "[&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5",
                "[&_strong]:font-bold [&_strong]:text-foreground [&_a]:font-bold [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4",
                className,
            )}
        >
            {children}
        </article>
    </div>
);
