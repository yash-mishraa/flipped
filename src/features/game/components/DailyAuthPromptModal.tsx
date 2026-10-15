"use client";

import React, { useEffect, useRef } from "react";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { X, Flame, ShieldCheck, Trophy, Sparkles } from "lucide-react";

export interface DailyAuthPromptModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly isWon?: boolean;
  readonly streak: number;
}

export function DailyAuthPromptModal({
  isOpen,
  onClose,
  isWon = true,
  streak,
}: DailyAuthPromptModalProps): React.JSX.Element | null {
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  // Focus trap & save prior focus
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
    } else {
      previouslyFocusedElement.current?.focus?.();
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-fade-in"
      style={{ minHeight: "100dvh" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      aria-describedby="auth-modal-desc"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative my-auto w-full max-w-sm sm:max-w-md max-h-[90dvh] overflow-y-auto rounded-3xl border-2 border-[#C49A6C]/80 bg-gradient-to-b from-[#2B1118] via-[#240E15] to-[#1A080D] p-5 sm:p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_30px_rgba(196,154,108,0.2)] animate-scale-up text-center focus:outline-none"
      >
        {/* Prominent Visible Cross Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-3.5 top-3.5 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 active:scale-95 border border-white/20 shadow-md transition-all duration-200 cursor-pointer z-10"
        >
          <X className="h-5 w-5 stroke-[2.5]" />
        </button>

        {/* Header Icon / Badge */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8C2333] to-[#59141F] text-[#F7F0E5] shadow-lg ring-4 ring-[#C49A6C]/30">
          {isWon ? <Trophy className="h-6 w-6 text-[#F7F0E5]" /> : <Flame className="h-6 w-6 text-[#F7F0E5]" />}
        </div>

        {/* Streak Pill */}
        {streak > 0 && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#C49A6C]/60 bg-[#C49A6C]/20 px-3 py-1 text-xs font-black text-[#E8C99B] uppercase tracking-wider">
            <Flame className="h-3.5 w-3.5 fill-[#E8C99B] text-[#E8C99B]" />
            <span>
              {streak} Day {streak === 1 ? "Streak" : "Streak"}
            </span>
            <Sparkles className="h-3 w-3 text-[#E8C99B]" />
          </div>
        )}

        {/* Title */}
        <h3
          id="auth-modal-title"
          className="mt-2.5 text-xl sm:text-2xl font-black tracking-tight text-white"
        >
          {isWon ? "Victory! Sync Your Progress" : "Round Finished! Sync Your Progress"}
        </h3>

        {/* Core Message */}
        <p
          id="auth-modal-desc"
          className="mt-1.5 text-sm sm:text-base font-bold text-[#F3A58E]"
        >
          Login or create an account in order to sync and save your progress.
        </p>

        <p className="mt-1 text-xs text-[#D7C4BA] leading-relaxed">
          Sync your daily streaks, solve times, and statistics seamlessly across all your devices and the global leaderboard.
        </p>

        {/* Local Storage reassurance */}
        <div className="mt-3.5 flex items-start gap-2.5 rounded-2xl border border-[#C49A6C]/40 bg-[#16060A]/80 p-3 text-left">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#E5B887]" />
          <p className="text-xs text-[#E8DDD5] leading-snug">
            <strong className="text-white">Guest streak preserved:</strong> If you choose not to log in, your streak of <strong className="text-[#E5B887]">{streak}</strong> will remain saved safely right here in this browser.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-col gap-2.5">
          <SignUpButton mode="modal">
            <button
              type="button"
              className="w-full rounded-full bg-[#8C2333] hover:bg-[#A3293C] py-3 text-sm font-bold font-sans tracking-tight text-white shadow-lg border border-[#C49A6C]/40 transition-all duration-200 ease-out hover:shadow-xl active:scale-[0.97] cursor-pointer"
            >
              <span className="font-bold">Create Free Account</span>
            </button>
          </SignUpButton>

          <SignInButton mode="modal">
            <button
              type="button"
              className="w-full rounded-full bg-white hover:bg-[#faeee0] py-2.5 text-xs sm:text-sm font-bold font-sans tracking-tight text-[#230E14] shadow-md border border-[#C49A6C]/60 transition-all duration-200 ease-out active:scale-[0.97] cursor-pointer"
            >
              <span className="font-bold">Already Have an Account? Log In</span>
            </button>
          </SignInButton>

          <button
            type="button"
            onClick={onClose}
            className="mt-0.5 py-1 text-xs font-semibold text-[#B89B93] hover:text-white transition-colors duration-200 cursor-pointer"
          >
            Keep Streak Locally in Browser (Maybe Later)
          </button>
        </div>
      </div>
    </div>
  );
}
