"use client";

import { PricingTable } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";

const Page = () => {
  const { resolvedTheme } = useTheme();

  return (
    <div className="mx-auto w-full max-w-[1000px] px-5 pb-24 sm:px-8">
      <section className="pt-10 text-center text-white sm:pt-16">
        <h1 className="mx-auto max-w-[760px] text-[40px] font-bold leading-[1.02] tracking-[-0.045em] text-balance sm:text-[64px]">
          Start free. Grow when you need to.
        </h1>
        <p className="mx-auto mt-4 max-w-[600px] text-lg font-medium text-white/90">
          One credit is one build or one change. Builds that cannot finish give the credit back.
        </p>
      </section>

      <section aria-label="Plans" className="mt-12 rounded-[24px] bg-card p-3 shadow-float sm:p-6">
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
              fontFamily: "var(--font-satoshi)",
              borderRadius: "14px",
            },
            elements: {
              pricingTableCard: "rounded-[18px]! border! border-border! shadow-none!",
              pricingTableCardTitle: "font-bold! tracking-[-0.02em]!",
              pricingTableCardFee: "font-bold! tracking-[-0.04em]!",
              formButtonPrimary: "rounded-full! shadow-none!",
            },
          }}
        />
      </section>

      <section aria-labelledby="faq-title" className="mx-auto mt-16 max-w-[760px]">
        <h2 id="faq-title" className="text-2xl font-bold tracking-[-0.03em]">Common questions</h2>
        <dl className="mt-4 divide-y divide-border border-y border-border">
          {[
            ["What counts as a credit?", "Building a new app or asking for a change uses one credit. Questions you ask about your app in the chat use one too."],
            ["What happens when I run out?", "Your projects and their code stay in your account. New builds wait until your credits reset each month, or until you go Pro."],
            ["Do failed builds cost anything?", "No. If Nova cannot finish a build after checking and repairing it, the credit goes back to you."],
          ].map(([q, a]) => (
            <div key={q} className="py-5">
              <dt className="font-bold">{q}</dt>
              <dd className="mt-1.5 leading-relaxed text-muted-foreground">{a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
};

export default Page;
