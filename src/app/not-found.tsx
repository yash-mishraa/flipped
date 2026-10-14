import React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FlippedSymbol } from "@/components/FlippedLogo";

export default function NotFound(): React.JSX.Element {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#F7F0E5]">
      <Header />
      <main className="mx-auto flex flex-1 w-full max-w-xl flex-col items-center justify-center px-4 py-8 text-center">
        <div className="rounded-3xl border border-[#C49A6C]/40 bg-white p-8 sm:p-10 shadow-xs space-y-4">
          <div className="mx-auto flex justify-center">
            <FlippedSymbol size={48} variant="crimson" />
          </div>

          <span className="inline-block rounded-full bg-[#faeee0] border border-[#C49A6C] px-3.5 py-1 text-xs font-bold text-[#7B1E2B] uppercase">
            404 • Page Not Found
          </span>

          <h1 className="text-3xl font-black text-[#32171D]">Phrase Unflipped</h1>

          <p className="text-sm text-[#6B4E55] leading-relaxed">
            The page you are looking for does not exist or has been moved. Let&apos;s get you back to solving puzzles!
          </p>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="rounded-full bg-[#7B1E2B] px-6 py-2.5 text-sm font-bold text-[#F7F0E5] shadow-xs hover:bg-[#631722] active:scale-[0.98] transition"
            >
              Return Home
            </Link>

            <Link
              href="/classic"
              className="rounded-full border border-[#C49A6C] bg-white px-6 py-2.5 text-sm font-semibold text-[#32171D] hover:bg-[#faeee0] active:scale-[0.98] transition"
            >
              Play Classic
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
