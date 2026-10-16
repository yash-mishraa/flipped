"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import type { Puzzle, TerminalResult } from "../domain/types";
import type { GameMode } from "../modes/mode-types";
import { syncUserProgress } from "../persistence/user-sync";
import { ShareButton } from "./ShareButton";
import { triggerVictoryConfetti } from "../utils/confetti";

export interface SuccessScreenProps {
  readonly puzzle: Puzzle;
  readonly terminalResult: TerminalResult;
  readonly onPlayAgain?: () => void;
  readonly mode?: GameMode;
  readonly onNextPuzzle?: () => void;
  readonly nextPuzzleLabel?: string;
  readonly date?: string;
}

/**
 * SuccessScreen renders the celebratory victory summary card:
 * - Solved answer phrase
 * - Both semantic transformations and their explanatory context
 * - Elapsed time, final frozen score, and hints used count
 * - Mode-aware next actions (Daily locked vs Classic replay)
 */
export function SuccessScreen({
  puzzle,
  terminalResult,
  onPlayAgain,
  mode,
  onNextPuzzle,
  nextPuzzleLabel = "Next Puzzle",
  date,
}: SuccessScreenProps): React.JSX.Element {
  const { isSignedIn, user } = useUser();
  const { finalScore, elapsedSeconds, hintsUsed, solvedPhrase } = terminalResult;
  const canonicalPhrase = puzzle.answerWords.join(" ");
  const isDaily = mode === "DAILY";
  const handleReplayAction = onNextPuzzle ?? onPlayAgain;

  useEffect(() => {
    triggerVictoryConfetti();
    if (isSignedIn && user?.id) {
      syncUserProgress(user.id);
    }
  }, [isSignedIn, user?.id]);

  return (
    <div
      role="region"
      aria-label="Puzzle solved victory summary"
      data-testid="success-screen"
      className="mx-auto w-full max-w-lg rounded-2xl border border-[#C49A6C] bg-white/95 p-6 shadow-lg backdrop-blur-sm sm:p-8"
    >
      <div className="flex flex-col items-center text-center">
        <span className="rounded-full bg-[#C49A6C] px-3.5 py-1 text-xs font-bold text-[#32171D] uppercase tracking-wider">
          {isDaily ? "Daily Puzzle Solved!" : "Puzzle Solved!"}
        </span>

        <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#32171D]">
          {solvedPhrase || canonicalPhrase}
        </h2>

        {/* Semantic Transformations Breakdown */}
        <div className="mt-5 w-full rounded-xl border border-[#C49A6C]/60 bg-[#faeee0]/50 p-4 text-left">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6870]">
            Transformations Explained
          </span>
          <div className="mt-2.5 space-y-3 text-xs sm:text-sm">
            {puzzle.transformations.map((trans, idx) => (
              <div key={`win-trans-${idx}`} className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2 font-bold text-[#32171D]">
                  <span>{trans.clueWord}</span>
                  <span className="text-[#8C6870]">→</span>
                  <span className="text-[#7B1E2B]">{trans.answerWord}</span>
                  <span className="rounded border border-[#C49A6C]/30 bg-[#faeee0] px-1.5 py-0.2 text-[10px] font-semibold text-[#6B4E55] uppercase">
                    {trans.relationship}
                  </span>
                </div>
                <p className="text-[#6B4E55] text-xs">{trans.explanation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Wordle-Style Stats Grid */}
        <div className="mt-5 w-full rounded-2xl border border-[#C49A6C]/60 bg-white p-4 shadow-2xs text-center">
          <div className="mb-2.5 flex items-center justify-center gap-2">
            <span className="h-px w-6 bg-[#C49A6C]/40" aria-hidden="true" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8C6870]">
              Performance
            </span>
            <span className="h-px w-6 bg-[#C49A6C]/40" aria-hidden="true" />
          </div>

          <div className="grid grid-cols-3 divide-x divide-[#C49A6C]/30 text-center">
            <div className="px-1">
              <p className="text-2xl sm:text-3xl font-black text-[#7B1E2B]">{finalScore}</p>
              <p className="mt-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#8C6870]">
                Score
              </p>
            </div>

            <div className="px-1">
              <p className="text-2xl sm:text-3xl font-black text-[#32171D]">{elapsedSeconds}s</p>
              <p className="mt-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#8C6870]">
                Time
              </p>
            </div>

            <div className="px-1">
              <p className="text-2xl sm:text-3xl font-black text-[#32171D]">{hintsUsed}</p>
              <p className="mt-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#8C6870]">
                Hints
              </p>
            </div>
          </div>
        </div>

        {/* Share Result */}
        <div className="mt-5 w-full flex justify-center">
          <ShareButton
            options={{
              mode: isDaily ? "DAILY" : "CLASSIC",
              date: isDaily ? date || puzzle.id : undefined,
              isWon: true,
              score: finalScore,
              elapsedSeconds,
              hintsUsed,
              wordLengths: [puzzle.answerWords[0]?.length || 4, puzzle.answerWords[1]?.length || 4],
            }}
          />
        </div>

        {/* Clerk Account Sync Banner for Guest Players */}
        {!isSignedIn && (
          <div className="mt-5 w-full rounded-xl border border-[#C49A6C] bg-[#faeee0]/70 p-4 text-center">
            <div className="text-xs font-bold text-[#7B1E2B] uppercase tracking-wider">
              Save &amp; Sync Your Progress
            </div>
            <p className="mt-1 text-xs text-[#6B4E55]">
              Playing as guest. Create a free account to track your daily streak and stats across devices!
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <SignUpButton mode="modal">
                <button
                  type="button"
                  onClick={() => {
                    if (
                      typeof window !== "undefined" &&
                      !(window as unknown as { Clerk?: { loaded?: boolean } }).Clerk?.loaded
                    ) {
                      window.location.href = "/sign-up";
                    }
                  }}
                  className="rounded-full bg-[#7B1E2B] px-4 py-2 text-xs font-bold font-sans tracking-tight text-[#F7F0E5] shadow-xs transition-all duration-200 ease-out hover:bg-[#631722] active:scale-[0.97] cursor-pointer"
                >
                  <span className="font-bold">Create Free Account</span>
                </button>
              </SignUpButton>
              <SignInButton mode="modal">
                <button
                  type="button"
                  onClick={() => {
                    if (
                      typeof window !== "undefined" &&
                      !(window as unknown as { Clerk?: { loaded?: boolean } }).Clerk?.loaded
                    ) {
                      window.location.href = "/sign-in";
                    }
                  }}
                  className="rounded-full border border-[#C49A6C] bg-white px-3.5 py-2 text-xs font-bold font-sans tracking-tight text-[#32171D] shadow-2xs transition-all duration-200 ease-out hover:bg-[#faeee0] active:scale-[0.97] cursor-pointer"
                >
                  <span className="font-bold">Log In</span>
                </button>
              </SignInButton>
            </div>
          </div>
        )}

        {isSignedIn && (
          <div className="mt-4 text-xs font-semibold text-[#7B1E2B]">
            Progress synced to your account
          </div>
        )}

        {/* Mode-Aware Action Buttons */}
        <div className="mt-5 flex w-full flex-col gap-2.5 sm:flex-row">
          {isDaily ? (
            <>
              <Link
                href="/classic"
                className="inline-flex flex-1 items-center justify-center rounded-full bg-[#7B1E2B] px-5 py-3 text-sm font-bold text-[#F7F0E5] shadow-md transition-all duration-200 ease-out hover:bg-[#631722] hover:shadow-lg active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B1E2B] focus-visible:ring-offset-2"
              >
                Play Classic Mode
              </Link>
              <Link
                href="/archive"
                className="inline-flex items-center justify-center rounded-full border border-[#C49A6C] bg-white px-5 py-3 text-sm font-semibold text-[#32171D] shadow-sm transition-all duration-200 ease-out hover:bg-[#faeee0] active:scale-[0.97]"
              >
                Daily Archive
              </Link>
            </>
          ) : (
            handleReplayAction && (
              <button
                type="button"
                onClick={handleReplayAction}
                data-testid="play-again-button"
                className="inline-flex flex-1 items-center justify-center rounded-full bg-[#7B1E2B] px-5 py-3 text-sm font-bold text-[#F7F0E5] shadow-md transition-all duration-200 ease-out hover:bg-[#631722] hover:shadow-lg active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B1E2B] focus-visible:ring-offset-2 cursor-pointer"
              >
                {mode === "CLASSIC" ? nextPuzzleLabel : "Play Again"}
              </button>
            )
          )}

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-[#C49A6C] bg-white px-5 py-3 text-sm font-semibold text-[#32171D] shadow-sm transition-all duration-200 ease-out hover:bg-[#faeee0] active:scale-[0.97]"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
