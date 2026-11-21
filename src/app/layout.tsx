import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TRPCReactProvider } from "@/trpc/client";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import {ClerkProvider} from '@clerk/nextjs'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nova: build apps with AI",
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
            colorPrimary: "#f97316",
            colorTextOnPrimaryBackground: "#ffffff",
            colorBackground: "#ffffff",
            colorInputBackground: "#ffffff",
            colorInputText: "#0a0a0a",
            colorTextSecondary: "#737373",
            borderRadius: "0.75rem",
          },
          elements: {
            formButtonPrimary:
              "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-300",
            card: "shadow-xl border border-border/50 backdrop-blur-xl",
            headerTitle: "text-foreground",
            headerSubtitle: "text-muted-foreground",
            socialButtonsBlockButton:
              "border border-border/50 hover:bg-accent hover:border-amber-500/40 transition-all duration-300 hover:shadow-md hover:shadow-amber-500/10",
            formFieldInput:
              "border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm transition-all duration-300 focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/20 focus:shadow-[0_0_20px_rgba(251,146,60,0.15)]",
            formFieldInputShowPasswordButton: "text-amber-500 hover:text-amber-600",
            footerActionLink: "text-orange-500 hover:text-orange-600 transition-colors",
            identityPreviewEditButton: "text-orange-500 hover:text-orange-600",
            formFieldLabel: "text-foreground",
            dividerLine: "bg-border/50",
            dividerText: "text-muted-foreground",
            formFieldSuccessText: "text-green-500",
            formFieldErrorText: "text-red-500",
            alertText: "text-foreground",
            formResendCodeLink: "text-orange-500 hover:text-orange-600",
          },
        }}>
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TRPCReactProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
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
