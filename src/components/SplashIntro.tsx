"use client";

import React, { useState, useEffect, useCallback } from "react";

// In-memory module flag to ensure intro only plays on fresh page loads/direct link visits,
// not on client-side SPA navigation between internal tabs.
let hasShownIntroThisPageLoad = false;

export interface SplashIntroProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

export function SplashIntro({
  onComplete,
  forceShow = false,
}: SplashIntroProps): React.JSX.Element | null {
  const [stage, setStage] = useState<"enter" | "active" | "exit" | "done">("enter");
  const [mounted, setMounted] = useState(false);

  const handleDismiss = useCallback(() => {
    if (stage === "exit" || stage === "done") return;
    setStage("exit");
    setTimeout(() => {
      setStage("done");
      hasShownIntroThisPageLoad = true;
      onComplete?.();
    }, 700);
  }, [stage, onComplete]);

  useEffect(() => {
    // Check if running in automated test environment (Playwright / Vitest)
    const isTestEnv =
      typeof window !== "undefined" &&
      (Boolean(window.navigator?.webdriver) || process.env.NODE_ENV === "test");

    if (hasShownIntroThisPageLoad && !forceShow) {
      setStage("done");
      return;
    }

    setMounted(true);

    // Initial smooth fade-in
    const enterTimer = setTimeout(() => {
      setStage("active");
    }, 50);

    // Stay for 2.2 - 2.5 seconds (or 100ms in test mode) then start smooth fade-out
    const holdDuration = isTestEnv ? 100 : 2300;
    const fadeTimer = setTimeout(() => {
      setStage("exit");
    }, holdDuration);

    // Complete exit and unmount from DOM
    const exitDuration = isTestEnv ? 200 : holdDuration + 700;
    const doneTimer = setTimeout(() => {
      setStage("done");
      hasShownIntroThisPageLoad = true;
      onComplete?.();
    }, exitDuration);

    // Allow user to dismiss with any key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        handleDismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [forceShow, handleDismiss, onComplete]);

  if (!mounted || stage === "done") {
    return null;
  }

  const isExiting = stage === "exit";
  const isActive = stage === "active";

  return (
    <div
      role="dialog"
      aria-label="Flipped Brand Introduction"
      data-testid="splash-intro"
      onClick={handleDismiss}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#7B1E2B] transition-opacity duration-700 ease-in-out cursor-pointer select-none ${
        isExiting
          ? "opacity-0 pointer-events-none"
          : isActive
            ? "opacity-100"
            : "opacity-0"
      }`}
    >
      <div
        className={`flex flex-col items-center text-center transition-all duration-700 ease-out ${
          isExiting
            ? "scale-105 opacity-0"
            : isActive
              ? "scale-100 opacity-100"
              : "scale-90 opacity-0"
        }`}
      >
        {/* Brand Symbol in Cream White (#F7F0E5) */}
        <div className="relative mb-5 flex h-20 w-20 items-center justify-center sm:h-24 sm:w-24">
          {/* Subtle soft radiant glow behind symbol */}
          <div
            className="absolute inset-0 rounded-full bg-[#F7F0E5]/10 blur-xl scale-125 pointer-events-none"
            aria-hidden="true"
          />
          <svg
            viewBox="0 0 64 64"
            width="80"
            height="80"
            className="relative z-10 shrink-0 drop-shadow-sm"
            aria-hidden="true"
          >
            <path
              d="M 0 0 L 64 0 L 48 16 L 16 16 L 16 64 L 0 64 Z M 24 24 L 56 24 L 40 40 L 24 40 Z"
              fill="#F7F0E5"
              fillRule="evenodd"
            />
          </svg>
        </div>

        {/* Wordmark: FLIPPED in Cream White (#F7F0E5) */}
        <div
          role="presentation"
          className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-[-0.02em] text-[#F7F0E5] leading-none drop-shadow-sm"
        >
          FLIPPED
        </div>

        {/* Tagline */}
        <p className="mt-3 text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-[#F7F0E5]/80">
          Word Deduction Puzzle
        </p>

        {/* Subtle decorative accent pill */}
        <div className="mt-8 flex items-center justify-center">
          <div className="h-1 w-12 rounded-full bg-[#F7F0E5]/30 overflow-hidden">
            <div className="h-full w-full bg-[#F7F0E5] rounded-full animate-pulse" />
          </div>
        </div>

        <span className="mt-4 text-[10px] font-medium tracking-wider text-[#F7F0E5]/40 uppercase">
          Tap anywhere to skip
        </span>
      </div>
    </div>
  );
}
