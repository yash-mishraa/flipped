import type { Metadata, Viewport } from "next";
import React from "react";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#7B1E2B",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "FLIPPED — Quick decisions. Lasting impressions.",
  description:
    "A split second. A different game. Deduce two clue words into a familiar phrase before the 60-second timer runs out. Movement without noise. Competition with character.",
  applicationName: "FLIPPED",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "FLIPPED — A split second. A different game.",
    description: "Quick decisions. Playful competition. Make your next move count.",
    type: "website",
    siteName: "FLIPPED",
  },
  twitter: {
    card: "summary",
    title: "FLIPPED — Quick decisions. Lasting impressions.",
    description: "A split second. A different game. The editorial word deduction puzzle.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F7F0E5] text-[#32171D] antialiased selection:bg-[#7B1E2B] selection:text-[#F7F0E5]">
        {children}
      </body>
    </html>
  );
}
