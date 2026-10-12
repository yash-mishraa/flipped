"use client";

import React from "react";
import Link from "next/link";
import { Hourglass, RotateCcw, Home, Clock, Sparkles, Lightbulb } from "lucide-react";
import type { Puzzle, TerminalResult } from "../domain/types";
import type { GameMode } from "../modes/mode-types";
import { ShareButton } from "./ShareButton";

export interface TimeoutScreenProps {
  readonly puzzle: Puzzle;
  readonly terminalResult: TerminalResult;
  readonly onPlayAgain?: () => void;
  readonly mode?: GameMode;
  readonly onNextPuzzle?: () => void;
  readonly nextPuzzleLabel?: string;
  readonly date?: string;
}

/**
 * TimeoutScreen renders the encouraging time-expired result screen:
 * - Time limit reached message
 * - Canonical solution phrase reveal
 * - Both semantic transformations and their explanatory context
 * - Practice potential score (clearly distinguished from completed puzzle score)
 * - Mode-aware next actions
 */
export function TimeoutScreen({
  puzzle,
  terminalResult,
  onPlayAgain,
  mode,
  onNextPuzzle,
  nextPuzzleLabel = "Next Puzzle",
  date,
}: TimeoutScreenProps): React.JSX.Element {
  const { hintsUsed, practiceScore, finalScore } = terminalResult;
  const canonicalPhrase = puzzle.answerWords.join(" ");
  // The practice metric is the potential points calculated before expiration
  const displayPracticeScore = practiceScore ?? finalScore;
  const isDaily = mode === "DAILY";
  const handleReplayAction = onNextPuzzle ?? onPlayAgain;

  return (
    <div
      role="region"
      aria-label="Round timed out summary"
      data-testid="timeout-screen"
      className="mx-auto w-full max-w-lg rounded-2xl border border-stone-300 bg-white/95 p-6 shadow-lg backdrop-blur-sm sm:p-8"
    >
      <div className="flex flex-col items-center text-center">
        {/* Hourglass Icon */}
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-stone-600 shadow-sm">
          <Hourglass className="h-7 w-7" aria-hidden="true" />
        </div>

        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-700 uppercase tracking-wider">
          {isDaily ? "Daily Time Limit Reached" : "Time Limit Reached"}
        </span>

        <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
          Time Ran Out!
        </h2>

        <p className="mt-1 text-xs sm:text-sm text-stone-600">
          The 60-second timer expired. Don&apos;t worry—word deduction takes practice!
        </p>

        {/* Revealed Solution */}
        <div className="mt-5 w-full rounded-xl border border-stone-200 bg-stone-50/80 p-4 text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            The Target Phrase Was
          </span>
          <p className="mt-1 text-xl sm:text-2xl font-black tracking-wider text-stone-900">
            {canonicalPhrase}
          </p>
        </div>

        {/* Semantic Transformations Breakdown */}
        <div className="mt-4 w-full rounded-xl border border-stone-200/90 bg-stone-50/70 p-4 text-left">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
            Transformations Explained
          </span>
          <div className="mt-2.5 space-y-3 text-xs sm:text-sm">
            {puzzle.transformations.map((trans, idx) => (
              <div key={`timeout-trans-${idx}`} className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2 font-bold text-stone-900">
                  <span>{trans.clueWord}</span>
                  <span className="text-stone-400">→</span>
                  <span className="text-coral-600">{trans.answerWord}</span>
                  <span className="rounded bg-stone-200/70 px-1.5 py-0.2 text-[10px] font-semibold text-stone-600 uppercase">
                    {trans.relationship}
                  </span>
                </div>
                <p className="text-stone-600 text-xs">{trans.explanation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Grid with Practice Score Distinction */}
        <div className="mt-5 grid w-full grid-cols-3 gap-2.5 text-center">
          <div className="rounded-xl border border-stone-100 bg-stone-50 p-3">
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-stone-500 uppercase">
              <Sparkles className="h-3 w-3 text-stone-400" aria-hidden="true" />
              <span>Practice Score</span>
            </div>
            <p className="mt-1 text-2xl font-black text-stone-700">{displayPracticeScore}</p>
            <span className="text-[10px] text-stone-400">(Official: 0)</span>
          </div>

          <div className="rounded-xl border border-stone-100 bg-stone-50 p-3">
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-stone-500 uppercase">
              <Clock className="h-3 w-3 text-stone-400" aria-hidden="true" />
              <span>Time</span>
            </div>
            <p className="mt-1 text-2xl font-black text-stone-900">60s</p>
            <span className="text-[10px] text-stone-400">Limit reached</span>
          </div>

          <div className="rounded-xl border border-stone-100 bg-stone-50 p-3">
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-stone-500 uppercase">
              <Lightbulb className="h-3 w-3 text-amber-500" aria-hidden="true" />
              <span>Hints</span>
            </div>
            <p className="mt-1 text-2xl font-black text-stone-900">{hintsUsed}</p>
            <span className="text-[10px] text-stone-400">Used</span>
          </div>
        </div>

        {/* Share Result */}
        <div className="mt-5 w-full flex justify-center">
          <ShareButton
            options={{
              mode: isDaily ? "DAILY" : "CLASSIC",
              date: isDaily ? (date ?? puzzle.id) : undefined,
              isWon: false,
              score: 0,
              elapsedSeconds: 60,
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
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-coral-500 px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-coral-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-500 focus-visible:ring-offset-2"
              >
                <span>Play Classic Mode</span>
              </Link>
              <Link
                href="/archive"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 active:scale-95"
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
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-coral-500 px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-coral-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-500 focus-visible:ring-offset-2"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>{mode === "CLASSIC" ? nextPuzzleLabel : "Play Again"}</span>
              </button>
            )
          )}

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 active:scale-95"
          >
            <Home className="h-4 w-4 text-stone-500" aria-hidden="true" />
            <span>Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
