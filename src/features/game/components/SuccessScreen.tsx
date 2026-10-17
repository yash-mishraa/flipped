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
        {/* Editorial Masthead Kicker */}
        <div className="flex items-center justify-center gap-3 w-full">
          <span className="h-px flex-1 max-w-[40px] bg-[#C49A6C]/50" aria-hidden="true" />
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] text-[#7B1E2B]">
            {isDaily ? "Daily Puzzle Solved!" : "Puzzle Solved!"}
          </span>
          <span className="h-px flex-1 max-w-[40px] bg-[#C49A6C]/50" aria-hidden="true" />
        </div>

        <h2 className="mt-3 font-serif text-3xl sm:text-4xl font-black tracking-tight text-[#32171D]">
          {solvedPhrase || canonicalPhrase}
        </h2>

        {/* Semantic Transformations Breakdown (Editorial Column) */}
        <div className="mt-5 w-full border-t border-[#C49A6C]/30 pt-5 text-left">
          <div className="flex items-center justify-between pb-2 mb-4 border-b border-[#C49A6C]/25">
            <div className="flex items-center gap-2">
              <span className="h-2 w-0.5 bg-[#7B1E2B]" aria-hidden="true" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#7B1E2B]">
                Transformations Explained
              </span>
            </div>
            <span className="text-[11px] font-serif italic text-[#8C6870]">
              Official Deductions
            </span>
          </div>
          <div className="space-y-4">
            {puzzle.transformations.map((trans, idx) => (
              <div key={`win-trans-${idx}`} className="border-l-2 border-[#C49A6C]/40 pl-3.5 py-0.5">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-mono text-sm sm:text-base font-extrabold uppercase text-[#32171D]">
                    {trans.clueWord}
                  </span>
                  <span className="font-serif text-xs italic text-[#8C6870]">
                    ({trans.relationship.toLowerCase()})
                  </span>
                  <span className="text-[#C49A6C] font-serif">→</span>
                  <span className="font-serif text-base sm:text-lg font-black text-[#7B1E2B] tracking-wide">
                    {trans.answerWord}
                  </span>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-[#6B4E55] leading-relaxed font-serif">
                  {trans.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Summary */}
        <div className="mt-5 w-full border-y border-[#C49A6C]/30 py-3.5 px-2 text-center">
          <div className="mb-2 text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#8C6870]">
              Performance
            </span>
          </div>

          <div className="grid grid-cols-3 text-center">
            <div className="px-1">
              <p className="text-2xl sm:text-3xl font-black text-[#7B1E2B] font-serif">{finalScore}</p>
              <p className="mt-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#8C6870]">
                Score
              </p>
            </div>

            <div className="px-1">
              <p className="text-2xl sm:text-3xl font-black text-[#32171D] font-mono">{elapsedSeconds}s</p>
              <p className="mt-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#8C6870]">
                Time
              </p>
            </div>

            <div className="px-1">
              <p className="text-2xl sm:text-3xl font-black text-[#32171D] font-mono">{hintsUsed}</p>
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
