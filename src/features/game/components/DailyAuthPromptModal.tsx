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

  // Prevent background scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6 bg-[#F7F0E5]/98 backdrop-blur-2xl animate-fade-in"
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
        className="relative my-auto w-full max-w-sm sm:max-w-md max-h-[88dvh] overflow-y-auto rounded-3xl border-2 border-[#C49A6C]/70 bg-white p-5 sm:p-6 shadow-2xl shadow-[#32171D]/15 animate-scale-up text-center focus:outline-none ring-1 ring-[#C49A6C]/20"
      >
        {/* Prominent Visible Cross Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-3.5 top-3.5 flex h-9 w-9 items-center justify-center rounded-full bg-[#faeee0] text-[#32171D] hover:bg-[#f4ddc5] active:scale-95 border border-[#C49A6C]/60 shadow-xs transition-all duration-200 cursor-pointer z-10"
        >
          <X className="h-5 w-5 stroke-[2.5]" />
        </button>

        {/* Header Icon / Badge */}
        <div className="mx-auto flex h-13 w-13 items-center justify-center rounded-2xl bg-[#7B1E2B] text-[#F7F0E5] shadow-md ring-4 ring-[#faeee0]">
          {isWon ? <Trophy className="h-6 w-6 text-[#F7F0E5]" /> : <Flame className="h-6 w-6 text-[#F7F0E5]" />}
        </div>

        {/* Streak Pill */}
        {streak > 0 && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#C49A6C]/60 bg-[#faeee0] px-3.5 py-1 text-xs font-black text-[#7B1E2B] uppercase tracking-wider">
            <Flame className="h-3.5 w-3.5 fill-[#7B1E2B] text-[#7B1E2B]" />
            <span>
              {streak} Day {streak === 1 ? "Streak" : "Streak"}
            </span>
            <Sparkles className="h-3 w-3 text-[#C49A6C]" />
          </div>
        )}

        {/* Title */}
        <h3
          id="auth-modal-title"
          className="mt-2.5 text-xl sm:text-2xl font-black tracking-tight text-[#32171D]"
        >
          {isWon ? "Victory! Sync Your Progress" : "Round Finished! Sync Your Progress"}
        </h3>

        {/* Core Message */}
        <p
          id="auth-modal-desc"
          className="mt-1.5 text-sm sm:text-base font-bold text-[#7B1E2B]"
        >
          Login or create an account in order to sync and save your progress.
        </p>

        <p className="mt-1 text-xs text-[#6B4E55] leading-relaxed">
          Sync your daily streaks, solve times, and statistics seamlessly across all your devices and the global leaderboard.
        </p>

        {/* Local Storage reassurance */}
        <div className="mt-3.5 flex items-start gap-2.5 rounded-2xl border border-[#C49A6C]/50 bg-[#faeee0]/70 p-3 text-left">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#7B1E2B]" />
          <p className="text-xs text-[#6B4E55] leading-snug">
            <strong className="text-[#32171D]">Guest streak preserved:</strong> If you choose not to log in, your streak of <strong>{streak}</strong> will remain saved safely right here in this browser.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-col gap-2.5">
          <SignUpButton mode="modal">
            <button
              type="button"
              className="w-full rounded-full bg-[#7B1E2B] hover:bg-[#631722] py-3 text-sm font-bold font-sans tracking-tight text-[#F7F0E5] shadow-md transition-all duration-200 ease-out hover:shadow-lg active:scale-[0.97] cursor-pointer"
            >
              <span className="font-bold">Create Free Account</span>
            </button>
          </SignUpButton>

          <SignInButton mode="modal">
            <button
              type="button"
              className="w-full rounded-full border border-[#C49A6C] bg-white hover:bg-[#faeee0] py-2.5 text-xs sm:text-sm font-bold font-sans tracking-tight text-[#32171D] shadow-xs transition-all duration-200 ease-out active:scale-[0.97] cursor-pointer"
            >
              <span className="font-bold">Already Have an Account? Log In</span>
            </button>
          </SignInButton>

          <button
            type="button"
            onClick={onClose}
            className="mt-0.5 py-1 text-xs font-semibold text-[#8C6870] hover:text-[#32171D] transition-colors duration-200 cursor-pointer"
          >
            Keep Streak Locally in Browser (Maybe Later)
          </button>
        </div>
      </div>
    </div>
  );
}
