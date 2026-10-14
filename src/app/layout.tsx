import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import React from "react";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#7B1E2B",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "FLIPPED — Word Deduction Puzzle",
  description:
    "Flip the meanings of two clue words to uncover a familiar phrase before your 60-second timer runs out.",
  applicationName: "FLIPPED",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "FLIPPED — Word Deduction Puzzle",
    description:
      "Flip the meanings of two clue words to uncover a familiar phrase before your 60-second timer runs out.",
    type: "website",
    siteName: "FLIPPED",
  },
  twitter: {
    card: "summary",
    title: "FLIPPED — Word Deduction Puzzle",
    description:
      "Flip the meanings of two clue words to uncover a familiar phrase before your 60-second timer runs out.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  const publishableKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    "pk_test_c2FmZS1jYXQtMjI1OC5jbGVyay5hY2NvdW50cy5kZXYk";

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F7F0E5] text-[#32171D] antialiased selection:bg-[#7B1E2B] selection:text-[#F7F0E5]">
        <ClerkProvider
          publishableKey={publishableKey}
          appearance={
            {
              layout: {
                unsafe_disableDevelopmentModeWarnings: true,
              },
            } as Record<string, unknown>
          }
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
