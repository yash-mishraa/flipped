"use client";

import React from "react";
import Link from "next/link";
import {
  Trophy,
  Hourglass,
  Sparkles,
  Clock,
  Lightbulb,
  Compass,
  Calendar,
  Home,
} from "lucide-react";
import type { Puzzle, LetterGrid as LetterGridType, LetterTile } from "../domain/types";
import type { DailyAttemptRecord } from "../modes/mode-types";
import { LetterGrid } from "./LetterGrid";

import { ShareButton } from "./ShareButton";

export interface DailyCompletionCardProps {
  readonly date: string;
  readonly puzzle: Puzzle;
  readonly attempt: DailyAttemptRecord;
}

/**
 * Constructs a fully solved, confirmed LetterGrid for review.
 */
function createSolvedGrid(puzzle: Puzzle): LetterGridType {
  const createWordTiles = (word: string, wordIndex: 0 | 1): readonly LetterTile[] => {
    return word.split("").map((letter, letterIndex) => ({
      wordIndex,
      letterIndex,
      letter: letter.toUpperCase(),
      isFixed: letterIndex === 0,
      isEntered: letterIndex !== 0,
      isEvaluated: true,
      feedback: "CONFIRMED" as const,
    }));
  };

  return {
    words: [createWordTiles(puzzle.answerWords[0], 0), createWordTiles(puzzle.answerWords[1], 1)],
  };
}

/**
 * Formats YYYY-MM-DD into a localized friendly date (e.g. "Monday, October 12, 2026").
 */
function formatFriendlyDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    if (!year || !month || !day) return dateStr;
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * DailyCompletionCard renders a comprehensive read-only review of an already completed
 * daily challenge, preserving attempt metrics, transformations, and the solved letter grid.
 */
export function DailyCompletionCard({
  date,
  puzzle,
  attempt,
}: DailyCompletionCardProps): React.JSX.Element {
  const isWon = attempt.status === "WON";
  const solvedGrid = createSolvedGrid(puzzle);
  const friendlyDate = formatFriendlyDate(date);
  const canonicalPhrase = puzzle.answerWords.join(" ");

  return (
    <div
      role="region"
      aria-label="Daily challenge completion review"
      data-testid="daily-completion-card"
      className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 rounded-3xl border border-stone-200 bg-white/95 p-6 shadow-xl backdrop-blur-sm sm:p-8"
    >
      {/* Header status indicator */}
      <div className="flex flex-col items-center text-center">
        <div
          className={`mb-3 flex h-14 w-14 items-center justify-center rounded-full shadow-sm ${
            isWon ? "bg-emerald-100 text-emerald-600" : "bg-stone-100 text-stone-600"
          }`}
        >
          {isWon ? (
            <Trophy className="h-7 w-7" aria-hidden="true" />
          ) : (
            <Hourglass className="h-7 w-7" aria-hidden="true" />
          )}
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
              isWon ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-700"
            }`}
          >
            {isWon ? "Daily Solved" : "Time Expired"}
          </span>
          <span className="text-xs font-semibold text-stone-500">• {date}</span>
        </div>

        <h2 className="mt-2 text-2xl font-black tracking-tight text-stone-900 sm:text-3xl">
          {attempt.solvedPhrase || canonicalPhrase}
        </h2>
        <p className="mt-1 text-xs text-stone-500 sm:text-sm">{friendlyDate}</p>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid w-full grid-cols-3 gap-2.5 text-center">
        <div className="rounded-2xl border border-stone-100 bg-stone-50 p-3.5">
          <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-stone-500 uppercase">
            <Sparkles className="h-3 w-3 text-coral-500" aria-hidden="true" />
            <span>Score</span>
          </div>
          <p className={`mt-1 text-2xl font-black ${isWon ? "text-coral-600" : "text-stone-700"}`}>
            {attempt.finalScore}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-100 bg-stone-50 p-3.5">
          <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-stone-500 uppercase">
            <Clock className="h-3 w-3 text-stone-400" aria-hidden="true" />
            <span>Time</span>
          </div>
          <p className="mt-1 text-2xl font-black text-stone-900">{attempt.elapsedSeconds}s</p>
        </div>

        <div className="rounded-2xl border border-stone-100 bg-stone-50 p-3.5">
          <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-stone-500 uppercase">
            <Lightbulb className="h-3 w-3 text-amber-500" aria-hidden="true" />
            <span>Hints</span>
          </div>
          <p className="mt-1 text-2xl font-black text-stone-900">{attempt.hintsUsed}</p>
        </div>
      </div>

      {/* Solved Grid Preview */}
      <section className="w-full" aria-label="Solved Letter Grid Review">
        <div className="mb-2 text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
            Solution Grid
          </span>
        </div>
        <LetterGrid
          grid={solvedGrid}
          selectedPosition={null}
          isRoundOver={true}
          onSelectTile={() => {}}
          onInputLetter={() => {}}
          onClearTile={() => {}}
          onNavigate={() => {}}
        />
      </section>

      {/* Transformations Explanation */}
      <div className="w-full rounded-2xl border border-stone-200/90 bg-stone-50/70 p-4 text-left">
        <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
          Transformations Explained
        </span>
        <div className="mt-2.5 space-y-3 text-xs sm:text-sm">
          {puzzle.transformations.map((trans, idx) => (
            <div key={`daily-rev-trans-${idx}`} className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2 font-bold text-stone-900">
                <span>{trans.clueWord}</span>
                <span className="text-stone-400">→</span>
                <span className="text-emerald-700">{trans.answerWord}</span>
                <span className="rounded bg-stone-200/70 px-1.5 py-0.5 text-[10px] font-semibold text-stone-600 uppercase">
                  {trans.relationship}
                </span>
              </div>
              <p className="text-stone-600 text-xs">{trans.explanation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* One-attempt reminder notice */}
      <div className="w-full rounded-xl bg-amber-50/80 border border-amber-200/60 p-3.5 text-center text-xs text-amber-900">
        <p className="font-semibold">Today&apos;s Daily Challenge is Locked</p>
        <p className="mt-0.5 text-amber-800">
          Daily challenges can only be played once for score. Come back tomorrow for the next
          puzzle, or play unlimited practice rounds in Classic mode!
        </p>
      </div>

      {/* Result Sharing */}
      <div className="w-full flex justify-center">
        <ShareButton
          options={{
            mode: "DAILY",
            date,
            isWon,
            score: attempt.finalScore,
            elapsedSeconds: attempt.elapsedSeconds,
            hintsUsed: attempt.hintsUsed,
            wordLengths: [puzzle.answerWords[0].length, puzzle.answerWords[1].length],
          }}
        />
      </div>

      {/* Navigation Actions */}
      <div className="flex w-full flex-col gap-2.5 sm:flex-row">
        <Link
          href="/classic"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-coral-500 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-coral-600 active:scale-95"
        >
          <Compass className="h-4 w-4" aria-hidden="true" />
          <span>Play Classic Mode</span>
        </Link>

        <Link
          href="/archive"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 active:scale-95"
        >
          <Calendar className="h-4 w-4 text-stone-500" aria-hidden="true" />
          <span>Daily Archive</span>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 active:scale-95"
        >
          <Home className="h-4 w-4 text-stone-500" aria-hidden="true" />
          <span>Home</span>
        </Link>
      </div>
    </div>
  );
}
