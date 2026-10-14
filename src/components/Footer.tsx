"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Keyboard, ShieldCheck } from "lucide-react";
import { TutorialModal } from "@/features/game/components/TutorialModal";

export function Footer(): React.JSX.Element {
  const [tutorialOpen, setTutorialOpen] = useState(false);

  return (
    <>
      <footer className="mt-16 border-t border-[#C49A6C]/40 bg-[#F7F0E5]/80 py-10 text-[#6B4E55] text-xs">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="font-extrabold text-sm tracking-tight text-[#32171D]">
                  FLIPPED
                </span>
                <span className="text-[#C49A6C]">•</span>
                <span className="text-[#6B4E55]">The Editorial Word Deduction Puzzle</span>
              </div>
              <p className="text-[11px] text-[#8C6D68]">
                Flip two clue words into a familiar phrase before the 60-second timer runs out.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTutorialOpen(true)}
                className="text-[#6B4E55] hover:text-[#7B1E2B] transition"
              >
                How to Play
              </button>
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

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#C49A6C]/20 pt-6 text-[11px] text-[#8C6D68]">
            <div className="flex items-center gap-1.5">
              <Keyboard className="h-3.5 w-3.5 text-[#C49A6C]" aria-hidden="true" />
              <span>
                Full keyboard navigation: Arrow keys rove, typing fills tiles, Backspace erases
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#C49A6C]" aria-hidden="true" />
              <span>Authoritative Server Scheduling & Cryptographic Session Security</span>
            </div>
          </div>
        </div>
      </footer>

      <TutorialModal isOpen={tutorialOpen} onClose={() => setTutorialOpen(false)} />
    </>
  );
}
