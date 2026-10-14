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
      className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 rounded-3xl border border-[#C49A6C] bg-white/95 p-6 shadow-xl backdrop-blur-sm sm:p-8"
    >
      {/* Header status indicator */}
      <div className="flex flex-col items-center text-center">
        <div
          className={`mb-3 flex h-14 w-14 items-center justify-center rounded-full shadow-sm ${
            isWon ? "bg-[#faeee0] text-[#C49A6C]" : "bg-[#faeee0] text-[#32171D]"
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
              isWon ? "bg-[#C49A6C] text-[#32171D]" : "border border-[#C49A6C] bg-[#faeee0] text-[#32171D]"
            }`}
          >
            {isWon ? "Daily Solved" : "Time Expired"}
          </span>
          <span className="text-xs font-semibold text-[#8C6870]">• {date}</span>
        </div>

        <h2 className="mt-2 text-2xl font-black tracking-tight text-[#32171D] sm:text-3xl">
          {attempt.solvedPhrase || canonicalPhrase}
        </h2>
        <p className="mt-1 text-xs text-[#6B4E55] sm:text-sm">{friendlyDate}</p>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid w-full grid-cols-3 gap-2.5 text-center">
        <div className="rounded-2xl border border-[#C49A6C]/30 bg-[#faeee0]/40 p-3.5">
          <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-[#8C6870] uppercase">
            <Sparkles className="h-3 w-3 text-[#7B1E2B]" aria-hidden="true" />
            <span>Score</span>
          </div>
          <p className={`mt-1 text-2xl font-black ${isWon ? "text-[#7B1E2B]" : "text-[#32171D]"}`}>
            {attempt.finalScore}
          </p>
        </div>

        <div className="rounded-2xl border border-[#C49A6C]/30 bg-[#faeee0]/40 p-3.5">
          <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-[#8C6870] uppercase">
            <Clock className="h-3 w-3 text-[#C49A6C]" aria-hidden="true" />
            <span>Time</span>
          </div>
          <p className="mt-1 text-2xl font-black text-[#32171D]">{attempt.elapsedSeconds}s</p>
        </div>

        <div className="rounded-2xl border border-[#C49A6C]/30 bg-[#faeee0]/40 p-3.5">
          <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-[#8C6870] uppercase">
            <Lightbulb className="h-3 w-3 text-[#C49A6C]" aria-hidden="true" />
            <span>Hints</span>
          </div>
          <p className="mt-1 text-2xl font-black text-[#32171D]">{attempt.hintsUsed}</p>
        </div>
      </div>

      {/* Solved Grid Preview */}
      <section className="w-full" aria-label="Solved Letter Grid Review">
        <div className="mb-2 text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6870]">
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
      <div className="w-full rounded-2xl border border-[#C49A6C]/60 bg-[#faeee0]/50 p-4 text-left">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6870]">
          Transformations Explained
        </span>
        <div className="mt-2.5 space-y-3 text-xs sm:text-sm">
          {puzzle.transformations.map((trans, idx) => (
            <div key={`daily-rev-trans-${idx}`} className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2 font-bold text-[#32171D]">
                <span>{trans.clueWord}</span>
                <span className="text-[#8C6870]">→</span>
                <span className="text-[#7B1E2B]">{trans.answerWord}</span>
                <span className="rounded border border-[#C49A6C]/30 bg-[#faeee0] px-1.5 py-0.5 text-[10px] font-semibold text-[#6B4E55] uppercase">
                  {trans.relationship}
                </span>
              </div>
              <p className="text-[#6B4E55] text-xs">{trans.explanation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* One-attempt reminder notice */}
      <div className="w-full rounded-xl bg-[#faeee0] border border-[#C49A6C]/60 p-3.5 text-center text-xs text-[#32171D]">
        <p className="font-semibold text-[#7B1E2B]">Today&apos;s Daily Challenge is Locked</p>
        <p className="mt-0.5 text-[#6B4E55]">
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
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#7B1E2B] px-5 py-3 text-sm font-bold text-[#F7F0E5] shadow-md transition hover:bg-[#631722] active:scale-95"
        >
          <Compass className="h-4 w-4" aria-hidden="true" />
          <span>Play Classic Mode</span>
        </Link>

        <Link
          href="/archive"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#C49A6C] bg-white px-4 py-3 text-sm font-semibold text-[#32171D] shadow-sm transition hover:bg-[#faeee0] active:scale-95"
        >
          <Calendar className="h-4 w-4 text-[#C49A6C]" aria-hidden="true" />
          <span>Daily Archive</span>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#C49A6C] bg-white px-4 py-3 text-sm font-semibold text-[#32171D] shadow-sm transition hover:bg-[#faeee0] active:scale-95"
        >
          <Home className="h-4 w-4 text-[#C49A6C]" aria-hidden="true" />
          <span>Home</span>
        </Link>
      </div>
    </div>
  );
}
