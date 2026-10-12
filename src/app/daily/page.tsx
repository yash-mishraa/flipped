"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, AlertCircle } from "lucide-react";
import { GameBoard } from "@/features/game/components/GameBoard";
import { DailyCompletionCard } from "@/features/game/components/DailyCompletionCard";
import { getDailyDateString, getDailyPuzzle } from "@/features/game/modes/daily-scheduler";
import { getDailyAttempt } from "@/features/game/persistence/local-progress";
import type { DailyPuzzleResult, DailyAttemptRecord } from "@/features/game/modes/mode-types";

export default function DailyPage(): React.JSX.Element {
  const [mounted, setMounted] = useState(false);
  const [dailyResult, setDailyResult] = useState<DailyPuzzleResult | null>(null);
  const [attempt, setAttempt] = useState<DailyAttemptRecord | null>(null);

  useEffect(() => {
    const todayStr = getDailyDateString();
    const result = getDailyPuzzle(todayStr);
    const savedAttempt = getDailyAttempt(todayStr);

    setDailyResult(result);
    setAttempt(savedAttempt);
    setMounted(true);
  }, []);

  if (!mounted || !dailyResult) {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-coral-500 border-t-transparent" />
        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-stone-400">
          Loading Today&apos;s Daily Challenge...
        </p>
      </main>
    );
  }

  // Handle unavailable or unpublished daily puzzle
  if (dailyResult.status !== "AVAILABLE") {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-12 text-center">
        <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-600">
            <AlertCircle className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900">Daily Challenge Notice</h1>
          <p className="mt-2 text-sm text-stone-600">{dailyResult.message}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/"
              className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
            >
              Return Home
            </Link>
            <Link
              href="/classic"
              className="rounded-xl bg-coral-500 px-4 py-2 text-sm font-bold text-white hover:bg-coral-600"
            >
              Play Classic Mode
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { puzzle, date } = dailyResult;

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-between px-4 py-8 sm:px-8 sm:py-12">
      {/* Navigation and Top Bar */}
      <header className="flex flex-col items-center gap-4 text-center">
        <div className="flex w-full items-center justify-between border-b border-stone-200/80 pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 active:scale-95"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Home</span>
          </Link>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-coral-200 bg-coral-50 px-3 py-1 text-xs font-semibold text-coral-700">
            <Calendar className="h-3.5 w-3.5 text-coral-600" aria-hidden="true" />
            <span>Daily Challenge • {date}</span>
          </div>

          <Link
            href="/archive"
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 active:scale-95"
          >
            <span>Archive</span>
          </Link>
        </div>

        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
            Daily Flipped
          </h1>
          <p className="mt-1 text-xs text-stone-500 sm:text-sm">
            One official challenge every day. 60 seconds to deduce the phrase.
          </p>
        </div>
      </header>

      {/* Main Interactive or Review View */}
      <section className="my-8 w-full flex-1 flex flex-col justify-center">
        {attempt ? (
          <DailyCompletionCard date={date} puzzle={puzzle} attempt={attempt} />
        ) : (
          <GameBoard
            puzzle={puzzle}
            mode="DAILY"
            date={date}
            onPuzzleComplete={() => {
              // Re-read attempt once saved
              const updatedAttempt = getDailyAttempt(date);
              if (updatedAttempt) {
                setAttempt(updatedAttempt);
              }
            }}
          />
        )}
      </section>

      {/* Footer Notice */}
      <footer className="border-t border-stone-200/80 pt-4 text-center text-xs text-stone-500">
        <p>
          Flipped Daily Challenge • Daily reset timezone: Asia/Kolkata (IST) • Single attempt per
          day
        </p>
      </footer>
    </main>
  );
}
