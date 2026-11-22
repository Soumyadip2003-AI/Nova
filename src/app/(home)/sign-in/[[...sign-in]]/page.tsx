"use client";

import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useCurrentTheme } from "@/hooks/use-current-theme";

const Page = () => {
    const currentTheme = useCurrentTheme();

    return (
        <div className="mx-auto grid w-full max-w-[1180px] flex-1 items-start gap-10 px-5 pb-20 pt-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16 lg:pt-16">
            <section className="text-white">
                <h1 className="max-w-[560px] text-[40px] font-bold leading-[1] tracking-[-0.045em] text-balance sm:text-[60px]">
                    Welcome back.
                </h1>
                <p className="mt-4 max-w-[440px] text-lg font-medium leading-relaxed text-white/90">
                    Sign in to keep your apps, versions and chats in one place.
                </p>
                <p className="mt-8 text-sm font-medium text-white/90">5 free credits every month. No card needed.</p>
            </section>
            <section aria-label="Sign in" className="flex justify-center lg:justify-end">
                <SignIn
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
                            colorBorder: "var(--input)",
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
                            // Clerk labels optional fields "Optional"; the form reads cleaner without it.
                            formFieldHintText: "hidden!",
                            formFieldInput: "border! border-input! bg-card! shadow-none! focus:border-foreground! focus:ring-2! focus:ring-ring/25!",
                        },
                    }}
                />
            </section>
        </div>
    );
};

export default Page;
