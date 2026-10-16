"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FlippedSymbol } from "@/components/FlippedLogo";
import { TutorialModal } from "@/features/game/components/TutorialModal";

export function Footer(): React.JSX.Element {
  const [showTutorial, setShowTutorial] = useState(false);

  return (
    <>
      <footer className="mt-auto bg-[#F7F0E5]/90 py-4 text-[#6B4E55] text-xs">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            {/* Brand Lockup & Attribution */}
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <FlippedSymbol size={18} variant="crimson" />
                <span className="font-extrabold text-sm tracking-tight text-[#32171D]">
                  FLIPPED
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#8C6D68] max-w-sm sm:max-w-md mx-auto sm:mx-0">
                Inspired by the Times of India Flipped Puzzle &bull; 100% Free &bull; Sprints &amp; Daily Archive
              </p>
            </div>

            {/* Balanced Navigation Links */}
            <div className="flex flex-col items-center sm:items-end gap-1.5">
              <nav
                aria-label="Footer Primary Navigation"
                className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-xs font-semibold text-[#6B4E55]"
              >
                <Link href="/daily" className="hover:text-[#7B1E2B] transition-colors duration-200 ease-out">
                  Daily
                </Link>
                <span className="text-[#C49A6C]/40 select-none" aria-hidden="true">•</span>
                <Link href="/classic" className="hover:text-[#7B1E2B] transition-colors duration-200 ease-out">
                  Classic
                </Link>
                <span className="text-[#C49A6C]/40 select-none" aria-hidden="true">•</span>
                <Link href="/archive" className="hover:text-[#7B1E2B] transition-colors duration-200 ease-out">
                  Archive
                </Link>
                <span className="text-[#C49A6C]/40 select-none" aria-hidden="true">•</span>
                <Link href="/stats" className="hover:text-[#7B1E2B] transition-colors duration-200 ease-out">
                  Statistics
                </Link>
                <span className="text-[#C49A6C]/40 select-none" aria-hidden="true">•</span>
                <Link
                  href="/#how-to-play"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowTutorial(true);
                  }}
                  className="hover:text-[#7B1E2B] transition-colors duration-200 ease-out cursor-pointer"
                >
                  How to Play
                </Link>
              </nav>

              <nav
                aria-label="Footer Legal & About Navigation"
                className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[11px] font-medium text-[#8C6870]"
              >
                <Link href="/about" className="hover:text-[#7B1E2B] transition-colors duration-200 ease-out">
                  About
                </Link>
                <span className="text-[#C49A6C]/40 select-none" aria-hidden="true">•</span>
                <Link href="/contact" className="hover:text-[#7B1E2B] transition-colors duration-200 ease-out">
                  Contact
                </Link>
                <span className="text-[#C49A6C]/40 select-none" aria-hidden="true">•</span>
                <Link href="/privacy" className="hover:text-[#7B1E2B] transition-colors duration-200 ease-out">
                  Privacy
                </Link>
                <span className="text-[#C49A6C]/40 select-none" aria-hidden="true">•</span>
                <Link href="/terms" className="hover:text-[#7B1E2B] transition-colors duration-200 ease-out">
                  Terms
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </footer>

      {/* Tutorial / How to Play Modal */}
      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
    </>
  );
}

