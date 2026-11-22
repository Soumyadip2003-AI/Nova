import type { Metadata } from "next";
import { Bricolage_Grotesque, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { TRPCReactProvider } from "@/trpc/client";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import {ClerkProvider} from '@clerk/nextjs'

const display = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const sans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
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
            colorPrimary: "#13213a",
            colorTextOnPrimaryBackground: "#ffffff",
            colorBackground: "#ffffff",
            colorInputBackground: "#ffffff",
            colorInputText: "#13213a",
            colorText: "#13213a",
            colorTextSecondary: "#3d4f6b",
            colorDanger: "#d7352b",
            colorSuccess: "#1f8a5b",
            fontFamily: "var(--font-plex-sans), system-ui, sans-serif",
            borderRadius: "0.625rem",
          },
          elements: {
            card: "border-[1.5px] border-[#13213a] shadow-[6px_6px_0_#13213a]",
            headerTitle: "font-[family-name:var(--font-bricolage)] font-bold",
            formButtonPrimary: "bg-[#13213a] hover:bg-[#13213a]/90 shadow-none",
            socialButtonsBlockButton: "border-[1.5px] border-[#13213a] hover:bg-[#f5e663]/40",
            formFieldInput: "border-[1.5px] border-[#c7d0db] focus:border-[#13213a] focus:ring-2 focus:ring-[#13213a]/20",
            footerActionLink: "text-[#13213a] underline underline-offset-2 hover:text-[#13213a]",
            identityPreviewEditButton: "text-[#13213a]",
            formResendCodeLink: "text-[#13213a] underline",
          },
        }}>
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${display.variable} ${sans.variable} ${mono.variable} font-sans antialiased`}
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
