"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

// In-memory module flag to ensure intro only plays once per fresh load/session,
// not on client-side SPA navigation between internal tabs.
let hasShownIntroThisPageLoad = false;

const isIntroSeenInSession = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage?.getItem("flipped_intro_seen") === "true";
  } catch {
    return false;
  }
};

const markIntroSeenInSession = (): void => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage?.setItem("flipped_intro_seen", "true");
  } catch {
    // Ignore storage errors in restricted private-browsing contexts
  }
};

export interface SplashIntroProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

export function SplashIntro({
  onComplete,
  forceShow = false,
}: SplashIntroProps): React.JSX.Element | null {
  const isAlreadySeen = (hasShownIntroThisPageLoad || isIntroSeenInSession()) && !forceShow;

  const [stage, setStage] = useState<"enter" | "active" | "exit" | "done">(() =>
    isAlreadySeen ? "done" : "enter"
  );
  const [mounted, setMounted] = useState(() => !isAlreadySeen);

  const dismissedRef = useRef(isAlreadySeen);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const handleDismiss = useCallback(() => {
    // Guard against duplicate dismiss triggers
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    hasShownIntroThisPageLoad = true;
    markIntroSeenInSession();

    // Cancel all pending timers immediately (prevents enterTimer or fadeTimer from resurfacing)
    clearAllTimers();

    // Start clean, smooth fade-out exit
    setStage("exit");

    // After fade-out finishes, permanently unmount from DOM
    const exitTimer = setTimeout(() => {
      setStage("done");
      setMounted(false);
      onCompleteRef.current?.();
    }, 400);

    timersRef.current.push(exitTimer);
  }, [clearAllTimers]);

  useEffect(() => {
    if (isAlreadySeen) {
      return;
    }

    setMounted(true);

    const isTestEnv =
      typeof window !== "undefined" &&
      (Boolean(window.navigator?.webdriver) || process.env.NODE_ENV === "test");

    // 1. Initial smooth fade-in
    const enterTimer = setTimeout(() => {
      if (!dismissedRef.current) {
        setStage("active");
      }
    }, 50);
    timersRef.current.push(enterTimer);

    // 2. Hold for ~4.2s (or 100ms in test environment), then initiate smooth exit
    const holdDuration = isTestEnv ? 100 : 4200;
    const fadeTimer = setTimeout(() => {
      handleDismiss();
    }, holdDuration);
    timersRef.current.push(fadeTimer);

    // 3. Allow user to dismiss with any key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        handleDismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearAllTimers();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAlreadySeen, handleDismiss, clearAllTimers]);

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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#7B1E2B] transition-opacity duration-400 ease-out cursor-pointer select-none ${
        isExiting
          ? "opacity-0 pointer-events-none"
          : isActive
            ? "opacity-100"
            : "opacity-0"
      }`}
    >
      <div
        className={`flex flex-col items-center text-center transition-all duration-400 ease-out ${
          isExiting
            ? "scale-95 opacity-0"
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
