import type { Metadata } from "next";
import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";
import { TRPCReactProvider } from "@/trpc/client";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import {ClerkProvider} from '@clerk/nextjs'

// Satoshi (Indian Type Foundry, free for commercial use via Fontshare), self-hosted.
const sans = localFont({
  variable: "--font-satoshi",
  display: "swap",
  src: [
    { path: "./fonts/Satoshi-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Satoshi-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Satoshi-700.woff2", weight: "700", style: "normal" },
  ],
});

const mono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "Nova: build apps with AI", template: "%s | Nova" },
  openGraph: { siteName: "Nova", type: "website", url: SITE.url },
  description: "Describe an app and Nova's AI agent writes, runs and fixes the code for you, with self-healing error recovery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
        appearance={{
          variables: {
            colorPrimary: "#0b1b33",
            colorTextOnPrimaryBackground: "#ffffff",
            colorBackground: "#ffffff",
            colorInputBackground: "#ffffff",
            colorInputText: "#0b1b33",
            colorText: "#0b1b33",
            colorTextSecondary: "#47546d",
            colorDanger: "#e5484d",
            colorSuccess: "#12a36a",
            fontFamily: "var(--font-satoshi), system-ui, sans-serif",
            borderRadius: "0.75rem",
          },
          elements: {
            card: "shadow-[0_1px_1px_rgba(11,27,51,.04),0_12px_32px_-12px_rgba(11,27,51,.18),0_40px_80px_-40px_rgba(11,27,51,.25)] border-0",
            headerTitle: "font-bold tracking-[-0.03em]",
            formButtonPrimary: "rounded-full bg-[#0b1b33] hover:bg-[#0b1b33]/90 shadow-none",
            socialButtonsBlockButton: "rounded-full border-[#e6e9ef] hover:bg-[#f6f8fb]",
            formFieldInput: "rounded-xl border-[#d5dae3] focus:border-[#0b1b33] focus:ring-2 focus:ring-[#7c5cff]/25",
            footerActionLink: "text-[#0b1b33] font-bold hover:text-[#0b1b33]",
          },
        }}>
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${sans.variable} ${mono.variable} font-sans antialiased`}
      >
        <TRPCReactProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <Toaster/>
            {children}
          </ThemeProvider>
        </TRPCReactProvider>
      </body>
    </html>
    </ClerkProvider>
      
  );
};
