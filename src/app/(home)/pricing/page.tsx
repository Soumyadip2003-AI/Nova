"use client";

import { PricingTable } from "@clerk/nextjs";
import { Logo } from "@/components/logo";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";

const Page = () => {
  const { resolvedTheme } = useTheme();

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-[40vh] py-16 md:py-20">
        {/* Floating orbs background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-amber-500/15 to-orange-500/15 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center max-w-4xl mx-auto px-4 space-y-6">
          {/* Logo with glow */}
          <Logo
            size={48}
            withContainer
            containerClassName="p-3 rounded-xl border border-amber-200/50 dark:border-amber-500/20 shadow-xl"
            hover
          />

          {/* Headline with gradient */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent">
                Pricing
              </span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Choose the perfect plan for your needs. Start free and scale as you grow.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Table Section */}
      <section className="relative max-w-5xl mx-auto w-full px-4 pb-16">
        <div className="relative group">
          {/* Animated gradient border glow */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-amber-500/50 via-orange-500/50 to-rose-500/50 rounded-2xl blur-sm opacity-75" />

          {/* Outer glow effect */}
          <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-rose-500/20 rounded-3xl blur-xl opacity-75" />

          {/* Pricing table container */}
          <div className="relative rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-amber-500/30 dark:border-amber-500/20 p-6 shadow-lg shadow-amber-500/10">
            <PricingTable
              appearance={{
                baseTheme: resolvedTheme === "dark" ? dark : undefined,
                variables: {
                  colorPrimary: "#f97316",
                  colorBackground: resolvedTheme === "dark" ? "#18181b" : "#ffffff",
                  colorInputBackground: resolvedTheme === "dark" ? "#27272a" : "#ffffff",
                  colorInputText: resolvedTheme === "dark" ? "#fafafa" : "#0a0a0a",
                  colorTextSecondary: "#737373",
                  borderRadius: "0.75rem",
                },
                elements: {
                  card: "bg-transparent shadow-none border-none",
                  formButtonPrimary:
                    "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-300",
                  priceAmount: "text-foreground",
                  pricingTableCard: "bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-700/50 rounded-xl transition-all duration-300 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/10",
                  pricingTableCardSelected: "border-amber-500 dark:border-amber-500 shadow-lg shadow-amber-500/20",
                },
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Page;