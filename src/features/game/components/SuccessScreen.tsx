"use client";

import React from "react";
import Link from "next/link";
import { Trophy, RotateCcw, Home, Clock, Sparkles, Lightbulb } from "lucide-react";
import type { Puzzle, TerminalResult } from "../domain/types";
import type { GameMode } from "../modes/mode-types";

import { ShareButton } from "./ShareButton";

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
  const { finalScore, elapsedSeconds, hintsUsed, solvedPhrase } = terminalResult;
  const canonicalPhrase = puzzle.answerWords.join(" ");
  const isDaily = mode === "DAILY";
  const handleReplayAction = onNextPuzzle ?? onPlayAgain;

  return (
    <div
      role="region"
      aria-label="Puzzle solved victory summary"
      data-testid="success-screen"
      className="mx-auto w-full max-w-lg rounded-2xl border border-[#C49A6C] bg-white/95 p-6 shadow-lg backdrop-blur-sm sm:p-8"
    >
      <div className="flex flex-col items-center text-center">
        {/* Celebration Trophy Icon */}
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#faeee0] text-[#C49A6C] shadow-sm">
          <Trophy className="h-7 w-7" aria-hidden="true" />
        </div>

        <span className="rounded-full bg-[#C49A6C] px-3 py-1 text-xs font-bold text-[#32171D] uppercase tracking-wider">
          {isDaily ? "Daily Puzzle Solved!" : "Puzzle Solved!"}
        </span>

        <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#32171D]">
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

        {/* Stats Grid */}
        <div className="mt-5 grid w-full grid-cols-3 gap-2.5 text-center">
          <div className="rounded-xl border border-[#C49A6C]/30 bg-[#faeee0]/40 p-3">
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-[#8C6870] uppercase">
              <Sparkles className="h-3 w-3 text-[#7B1E2B]" aria-hidden="true" />
              <span>Score</span>
            </div>
            <p className="mt-1 text-2xl font-black text-[#7B1E2B]">{finalScore}</p>
          </div>

          <div className="rounded-xl border border-[#C49A6C]/30 bg-[#faeee0]/40 p-3">
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-[#8C6870] uppercase">
              <Clock className="h-3 w-3 text-[#C49A6C]" aria-hidden="true" />
              <span>Time</span>
            </div>
            <p className="mt-1 text-2xl font-black text-[#32171D]">{elapsedSeconds}s</p>
          </div>

          <div className="rounded-xl border border-[#C49A6C]/30 bg-[#faeee0]/40 p-3">
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-[#8C6870] uppercase">
              <Lightbulb className="h-3 w-3 text-[#C49A6C]" aria-hidden="true" />
              <span>Hints</span>
            </div>
            <p className="mt-1 text-2xl font-black text-[#32171D]">{hintsUsed}</p>
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

        {/* Mode-Aware Action Buttons */}
        <div className="mt-5 flex w-full flex-col gap-2.5 sm:flex-row">
          {isDaily ? (
            <>
              <Link
                href="/classic"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#7B1E2B] px-5 py-3 text-sm font-bold text-[#F7F0E5] shadow-md transition-all hover:bg-[#631722] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B1E2B] focus-visible:ring-offset-2"
              >
                <span>Play Classic Mode</span>
              </Link>
              <Link
                href="/archive"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#C49A6C] bg-white px-5 py-3 text-sm font-semibold text-[#32171D] shadow-sm transition hover:bg-[#faeee0] active:scale-95"
              >
                <span>Daily Archive</span>
              </Link>
            </>
          ) : (
            handleReplayAction && (
              <button
                type="button"
                onClick={handleReplayAction}
                data-testid="play-again-button"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#7B1E2B] px-5 py-3 text-sm font-bold text-[#F7F0E5] shadow-md transition-all hover:bg-[#631722] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B1E2B] focus-visible:ring-offset-2"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>{mode === "CLASSIC" ? nextPuzzleLabel : "Play Again"}</span>
              </button>
            )
          )}

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#C49A6C] bg-white px-5 py-3 text-sm font-semibold text-[#32171D] shadow-sm transition hover:bg-[#faeee0] active:scale-95"
          >
            <Home className="h-4 w-4 text-[#C49A6C]" aria-hidden="true" />
            <span>Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
