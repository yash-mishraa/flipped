import type { Metadata } from "next";
import React from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flipped — Word Puzzle Game",
  description:
    "A production-quality word puzzle game featuring Daily challenges and Classic mode with automatic answer detection.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#fcfbf9] text-[#24272c] antialiased">{children}</body>
    </html>
  );
}
