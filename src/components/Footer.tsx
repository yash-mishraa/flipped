"use client";

import React from "react";
import Link from "next/link";
import { FlippedSymbol } from "@/components/FlippedLogo";

export function Footer(): React.JSX.Element {
  return (
    <footer className="mt-16 border-t border-[#C49A6C]/40 bg-[#F7F0E5]/80 py-8 text-[#6B4E55] text-xs">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <FlippedSymbol size={18} variant="crimson" />
              <span className="font-extrabold text-sm tracking-tight text-[#32171D]">
                FLIPPED
              </span>
            </div>
            <p className="text-[11px] text-[#8C6D68]">
              Inspired by the Times of India &ldquo;Flipped It&rdquo; puzzle &bull; 100% Free to play with timed sprints, daily archive, and cloud sync.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
            <Link href="/#how-to-play" className="text-[#6B4E55] hover:text-[#7B1E2B] transition">
              How to Play
            </Link>
            <Link href="/daily" className="text-[#6B4E55] hover:text-[#7B1E2B] transition">
              Daily Challenge
            </Link>
            <Link href="/classic" className="text-[#6B4E55] hover:text-[#7B1E2B] transition">
              Classic Practice
            </Link>
            <Link href="/archive" className="text-[#6B4E55] hover:text-[#7B1E2B] transition">
              Archive
            </Link>
            <Link href="/stats" className="text-[#6B4E55] hover:text-[#7B1E2B] transition">
              Statistics
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
