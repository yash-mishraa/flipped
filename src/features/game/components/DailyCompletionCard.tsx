"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import type { Puzzle, LetterGrid as LetterGridType, LetterTile } from "../domain/types";
import type { DailyAttemptRecord } from "../modes/mode-types";
import { LetterGrid } from "./LetterGrid";
import { ShareButton } from "./ShareButton";
import { triggerVictoryConfetti } from "../utils/confetti";
import { calculateDailyStreaks } from "../modes/statistics";
import { loadProgress } from "../persistence/local-progress";
import { syncUserProgress } from "../persistence/user-sync";
import { DailyAuthPromptModal } from "./DailyAuthPromptModal";

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
 * Formats YYYY-MM-DD into a localized friendly date (e.g. "Wednesday, October 14, 2026").
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
 * Returns celebration praise text based on the attempt score.
 */
function getPraiseText(score: number): string {
  if (score >= 95) return "Genius!";
  if (score >= 85) return "Magnificent!";
  if (score >= 70) return "Impressive!";
  if (score >= 50) return "Well Done!";
  return "Solved!";
}

import {
  getMillisecondsUntilNextLocalMidnight,
  formatCountdown,
} from "../modes/daily-scheduler";

/**
 * Formats countdown to next local midnight time (00:00:00 local time).
 */
function getFormattedCountdown(): string {
  const diffMs = getMillisecondsUntilNextLocalMidnight();
  return formatCountdown(diffMs);
}

/**
 * DailyCompletionCard renders a celebratory, comprehensive victory review of a daily challenge.
 * Includes confetti burst on victory, 4-stat metrics with live streak, solution grid,
 * semantic transformations, live next puzzle countdown, and account synchronization.
 */
export function DailyCompletionCard({
  date,
  puzzle,
  attempt,
}: DailyCompletionCardProps): React.JSX.Element {
  const { isSignedIn, user } = useUser();
  const isWon = attempt.status === "WON";
  const solvedGrid = createSolvedGrid(puzzle);
  const friendlyDate = formatFriendlyDate(date);
  const canonicalPhrase = puzzle.answerWords.join(" ");

  // Initial local streak calculation
  const [streak, setStreak] = useState<number>(() => {
    const progress = loadProgress();
    const streaks = calculateDailyStreaks(progress.daily, date);
    return streaks.currentStreak > 0 ? streaks.currentStreak : isWon && !attempt.isArchive ? 1 : 0;
  });

  // Live countdown to next daily challenge
  const [countdown, setCountdown] = useState<string>(getFormattedCountdown);

  // Pop-up modal prompting guest users to log in or create an account to sync progress
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  useEffect(() => {
    if (!isSignedIn) {
      // Reveal the pop-up modal smoothly every time a guest user visits completed challenge
      const timer = setTimeout(() => {
        setShowAuthModal(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isSignedIn, date]);

  const handleCloseAuthModal = () => {
    setShowAuthModal(false);
  };

  // Trigger celebration confetti on victory and sync with cloud database
  useEffect(() => {
    if (isWon) {
      triggerVictoryConfetti();
    }

    if (isSignedIn && user?.id) {
      syncUserProgress(user.id).then((res) => {
        if (res?.stats?.daily?.currentStreak !== undefined) {
          setStreak(res.stats.daily.currentStreak);
        }
      });
    }
  }, [isWon, isSignedIn, user?.id]);

  // Live countdown timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getFormattedCountdown());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      role="region"
      aria-label="Daily challenge completion review"
      data-testid="daily-completion-card"
      className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 rounded-3xl border border-[#C49A6C]/70 bg-white/95 p-6 shadow-xl backdrop-blur-md sm:p-8"
    >
      {/* Header status indicator & Celebration Praise */}
      <div className="flex flex-col items-center text-center w-full">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider ${
              isWon
                ? "bg-[#7B1E2B] text-[#F7F0E5] shadow-xs"
                : "border border-[#C49A6C] bg-[#faeee0] text-[#32171D]"
            }`}
          >
            {isWon ? "Daily Solved" : "Time Expired"}
          </span>
          <span className="text-xs font-semibold text-[#8C6870]">• {date}</span>
        </div>

        {isWon && (
          <div className="mt-3 text-base sm:text-lg font-black tracking-widest uppercase text-[#7B1E2B] animate-fade-in">
            {getPraiseText(attempt.finalScore)}
          </div>
        )}

        <h2 className="mt-1 text-2xl sm:text-4xl font-black tracking-tight text-[#32171D]">
          {attempt.solvedPhrase || canonicalPhrase}
        </h2>
        <p className="mt-1 text-xs text-[#6B4E55] sm:text-sm">{friendlyDate}</p>
      </div>

      {/* Wordle-Style 4-Stat Summary Block: Single row across mobile & desktop with dividers */}
      <div className="w-full rounded-2xl border border-[#C49A6C]/60 bg-white p-4 shadow-2xs text-center">
        <div className="mb-3 flex items-center justify-center gap-2">
          <span className="h-px w-6 bg-[#C49A6C]/40" aria-hidden="true" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8C6870]">
            Statistics
          </span>
          <span className="h-px w-6 bg-[#C49A6C]/40" aria-hidden="true" />
        </div>

        <div className="grid grid-cols-4 divide-x divide-[#C49A6C]/30 text-center">
          <div className="px-1">
            <p className={`text-2xl sm:text-3xl font-black ${isWon ? "text-[#7B1E2B]" : "text-[#32171D]"}`}>
              {attempt.finalScore}
            </p>
            <p className="mt-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#8C6870]">
              Score
            </p>
          </div>

          <div className="px-1">
            <p className="text-2xl sm:text-3xl font-black text-[#32171D]">{attempt.elapsedSeconds}s</p>
            <p className="mt-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#8C6870]">
              Time
            </p>
          </div>

          <div className="px-1">
            <p className="text-2xl sm:text-3xl font-black text-[#32171D]">{attempt.hintsUsed}</p>
            <p className="mt-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#8C6870]">
              Hints
            </p>
          </div>

          <div className="px-1">
            <p className="text-2xl sm:text-3xl font-black text-[#7B1E2B]">{streak}</p>
            <p className="mt-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#8C6870]">
              Streak
            </p>
          </div>
        </div>
      </div>

      {/* Solved Grid Preview Framed in Inset Stage */}
      <section
        className="w-full rounded-2xl border border-[#C49A6C]/45 bg-[#faeee0]/40 p-4 shadow-2xs"
        aria-label="Solved Letter Grid Review"
      >
        <div className="mb-3 text-center">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8C6870]">
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

      {/* Live Countdown to Next Daily Challenge */}
      <div className="w-full rounded-2xl border border-[#C49A6C]/40 bg-[#faeee0]/30 py-3.5 px-4 text-center">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6870]">
          Next Daily Challenge In (Midnight)
        </span>
        <div className="mt-0.5 font-mono text-xl font-black text-[#32171D]">
          {countdown}
        </div>
      </div>

      {/* Account Cloud Sync Status */}
      {isSignedIn ? (
        <div className="text-xs font-semibold text-[#7B1E2B] text-center">
          Daily streak &amp; statistics synced to your account
        </div>
      ) : (
        <div className="w-full rounded-2xl border-2 border-[#C49A6C]/70 bg-[#faeee0]/80 p-4 text-center space-y-2.5 shadow-xs">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#C49A6C]/60 px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-[#7B1E2B]">
            Sync &amp; Save Your Streak
          </div>
          <p className="text-xs text-[#6B4E55] max-w-sm mx-auto leading-relaxed">
            <strong className="text-[#7B1E2B]">Guest Session:</strong> Streak ({streak}) saved locally in this browser. Log in or create a free account to sync across devices!
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="rounded-full bg-[#7B1E2B] px-5 py-2 text-xs font-bold font-sans tracking-tight text-[#F7F0E5] shadow-xs hover:bg-[#631722] active:scale-[0.97] transition-all duration-200 cursor-pointer"
            >
              Sync with Account
            </button>
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="rounded-full border border-[#C49A6C] bg-white px-4 py-2 text-xs font-bold font-sans tracking-tight text-[#32171D] shadow-2xs hover:bg-[#faeee0] active:scale-[0.97] transition-all duration-200 cursor-pointer"
            >
              Log In
            </button>
          </div>
        </div>
      )}

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
          className="inline-flex flex-1 items-center justify-center rounded-full bg-[#7B1E2B] px-5 py-3 text-sm font-bold text-[#F7F0E5] shadow-md transition-all duration-200 ease-out hover:bg-[#631722] hover:shadow-lg active:scale-[0.97]"
        >
          Play Classic Mode
        </Link>

        <Link
          href="/archive"
          className="inline-flex items-center justify-center rounded-full border border-[#C49A6C] bg-white px-5 py-3 text-sm font-semibold text-[#32171D] shadow-sm transition-all duration-200 ease-out hover:bg-[#faeee0] active:scale-[0.97]"
        >
          Daily Archive
        </Link>

        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full border border-[#C49A6C] bg-white px-5 py-3 text-sm font-semibold text-[#32171D] shadow-sm transition-all duration-200 ease-out hover:bg-[#faeee0] active:scale-[0.97]"
        >
          Home
        </Link>
      </div>

      {/* Pop-up Auth Modal prompting new/guest users to sync their progress while preserving local streak */}
      <DailyAuthPromptModal
        isOpen={showAuthModal && !isSignedIn}
        onClose={handleCloseAuthModal}
        isWon={isWon}
        streak={streak}
      />
    </div>
  );
}

