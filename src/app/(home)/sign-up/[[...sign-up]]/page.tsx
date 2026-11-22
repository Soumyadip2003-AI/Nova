"use client";

import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useCurrentTheme } from "@/hooks/use-current-theme";

const Page = () => {
    const currentTheme = useCurrentTheme();

    return (
        <div className="mx-auto grid w-full max-w-[1180px] flex-1 items-start gap-10 px-5 pb-20 pt-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16 lg:pt-16">
            <section className="text-white">
                <h1 className="max-w-[560px] text-[40px] font-bold leading-[1] tracking-[-0.045em] text-balance sm:text-[60px]">
                    Your ideas, built and working.
                </h1>
                <p className="mt-4 max-w-[440px] text-lg font-medium leading-relaxed text-white/90">
                    Create a free account and build your first app in minutes.
                </p>
                <p className="mt-8 text-sm font-medium text-white/90">5 free credits every month. No card needed.</p>
            </section>
            <section aria-label="Create an account" className="flex justify-center lg:justify-end">
                <SignUp
                    appearance={{
                        baseTheme: currentTheme === "dark" ? dark : undefined,
                        variables: {
                            colorPrimary: "var(--primary)",
                            colorPrimaryForeground: "var(--primary-foreground)",
                            colorBackground: "var(--card)",
                            colorForeground: "var(--foreground)",
                            colorMutedForeground: "var(--muted-foreground)",
                            colorInput: "var(--card)",
                            colorInputForeground: "var(--foreground)",
                            colorBorder: "var(--border)",
                            colorRing: "var(--ring)",
                            colorDanger: "var(--destructive)",
                            colorSuccess: "var(--success)",
                            fontFamily: "var(--font-satoshi)",
                            borderRadius: "12px",
                        },
                        elements: {
                            cardBox: "max-w-full rounded-[24px]! border-0! shadow-float!",
                            headerTitle: "text-2xl! font-bold! tracking-[-0.03em]!",
                            socialButtonsBlockButton: "rounded-full! border! border-border!",
                            formButtonPrimary: "rounded-full! shadow-none!",
                        },
                    }}
                />
            </section>
        </div>
    );
};

export default Page;
