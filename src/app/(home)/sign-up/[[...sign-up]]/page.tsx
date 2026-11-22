"use client";

import { SignUp } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { useCurrentTheme } from '@/hooks/use-current-theme'

const Page =() =>{
    const currentTheme = useCurrentTheme();

    return(
        <div className="grid w-full flex-1 md:grid-cols-2">
         <section className="flex flex-col justify-between gap-10 bg-foreground p-8 text-background md:p-14 dark:bg-card dark:text-card-foreground">
            <div>
              <p className="font-display text-4xl font-bold leading-[1.05] tracking-[-0.02em] text-balance md:text-5xl">
                Your idea, built and <span className="bg-accent px-1 text-accent-foreground">checked</span> before you see it.
              </p>
              <p className="mt-4 max-w-md text-base leading-relaxed opacity-80 md:text-lg">
                Make a free account, describe the app you want, and Nova builds it and checks its own work.
              </p>
            </div>
            <p className="font-mono text-sm opacity-80">5 free credits every month. No card needed.</p>
         </section>
         <section aria-label="Create an account" className="bg-grid order-first flex items-center justify-center px-4 py-10 md:order-none md:p-10">
              <div className="max-w-full rounded-2xl shadow-stamp">
              <SignUp
                appearance={{
                  baseTheme: currentTheme === "dark" ? dark : undefined,
                  variables: {
                    colorPrimary: "var(--primary)",
                    colorPrimaryForeground: "var(--primary-foreground)",
                    colorBackground: "var(--card)",
                    colorForeground: "var(--foreground)",
                    colorMutedForeground: "var(--muted-foreground)",
                    colorMuted: "var(--muted)",
                    colorInput: "var(--card)",
                    colorInputForeground: "var(--foreground)",
                    colorBorder: "var(--border)",
                    colorRing: "var(--ring)",
                    colorDanger: "var(--destructive)",
                    colorSuccess: "var(--success)",
                    fontFamily: "var(--font-plex-sans)",
                    borderRadius: "10px",
                  },
                  elements: {
                    cardBox: "max-w-full rounded-2xl! border-[1.5px]! border-foreground! shadow-none!",
                    headerTitle: "font-display text-2xl!",
                    socialButtonsBlockButton: "border-[1.5px]! border-foreground!",
                    formButtonPrimary: "shadow-none!",
                  },
                }}
              />
              </div>
         </section>
        </div>
    )
}

export default Page;
