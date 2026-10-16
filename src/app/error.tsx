"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FlippedSymbol } from "@/components/FlippedLogo";
import { RotateCcw, Home, MessageSquare, AlertTriangle } from "lucide-react";

export interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps): React.JSX.Element {
  useEffect(() => {
    // Log error for client diagnosis
    console.error("Application error caught by boundary:", error);
  }, [error]);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#F7F0E5]">
      <Header />
      <main className="mx-auto flex flex-1 w-full max-w-xl flex-col items-center justify-center px-4 py-8 text-center">
        <div className="w-full rounded-3xl border border-[#C49A6C]/50 bg-white/95 p-8 sm:p-10 shadow-lg space-y-5 backdrop-blur-sm">
          <div className="mx-auto flex justify-center">
            <FlippedSymbol size={52} variant="crimson" />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#faeee0] border border-[#C49A6C] px-3.5 py-1 text-xs font-bold text-[#7B1E2B] uppercase tracking-wider">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Something Flipped Wrong</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-[#32171D] tracking-tight">
            Unexpected Puzzle Hitch
          </h1>

          <p className="text-xs sm:text-sm text-[#6B4E55] leading-relaxed max-w-md mx-auto">
            We ran into an unexpected hiccup loading this screen. Your streaks and game progress remain safe in your browser.
          </p>

          {error.digest && (
            <p className="font-mono text-[11px] text-[#8C6870] bg-[#faeee0]/60 rounded-lg py-1 px-2.5 inline-block">
              Error Digest: {error.digest}
            </p>
          )}

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center gap-2 rounded-full bg-[#7B1E2B] px-6 py-2.5 text-xs sm:text-sm font-bold text-[#F7F0E5] shadow-md hover:bg-[#631722] active:scale-95 transition cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Try Again</span>
            </button>

            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-[#C49A6C] bg-white px-6 py-2.5 text-xs sm:text-sm font-semibold text-[#32171D] hover:bg-[#faeee0] active:scale-95 transition"
            >
              <Home className="h-4 w-4 text-[#8C6870]" />
              <span>Return Home</span>
            </Link>

            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 text-xs text-[#7B1E2B] hover:underline font-semibold w-full justify-center pt-2"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Report this issue to developer</span>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
