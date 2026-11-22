"use client";

import { PricingTable } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";

const Page = () => {
  const { resolvedTheme } = useTheme();

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-5xl px-4 py-12 md:py-20">
        <section className="max-w-3xl">
          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-[-0.02em] text-balance md:text-6xl">
            One credit, one app <span className="mark-highlight">built and checked</span>.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
            If Nova cannot finish a build, the credit comes back.
          </p>
        </section>


        <section aria-label="Plans" className="mt-10">
          <PricingTable
            appearance={{
              baseTheme: resolvedTheme === "dark" ? dark : undefined,
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
                pricingTableCard:
                  "rounded-2xl! border-[1.5px]! border-foreground! shadow-none!",
                pricingTableCardTitle: "font-display",
                pricingTableCardFee: "font-display",
                formButtonPrimary: "rounded-[10px]! shadow-none!",
              },
            }}
          />
        </section>
      </div>
    </div>
  );
};

export default Page;
