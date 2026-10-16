import React from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FlippedSymbol } from "@/components/FlippedLogo";

export default function Loading(): React.JSX.Element {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#F7F0E5]" data-testid="app-loading">
      <Header />
      <main className="mx-auto flex flex-1 w-full max-w-xl flex-col items-center justify-center px-4 py-12 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative flex items-center justify-center">
            {/* Soft pulsing ring backdrop */}
            <div className="absolute h-20 w-20 animate-ping rounded-2xl bg-[#7B1E2B]/15" />
            <div className="relative animate-pulse">
              <FlippedSymbol size={56} variant="crimson" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#7B1E2B]">
              Loading FLIPPED
            </p>
            <p className="text-[11px] sm:text-xs text-[#6B4E55]">
              Shuffling clues and setting up puzzle...
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
