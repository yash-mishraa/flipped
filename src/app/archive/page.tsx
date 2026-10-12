"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Trophy, Hourglass, ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  getPublishedDailySchedule,
  getDailyDateString,
} from "@/features/game/modes/daily-scheduler";
import { PUBLIC_PUZZLES_BY_ID } from "@/features/game/data/public-puzzles";
import { loadProgress } from "@/features/game/persistence/local-progress";
import type { DailyAttemptRecord } from "@/features/game/modes/mode-types";

function formatFriendlyDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    if (!year || !month || !day) return dateStr;
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch {
    return dateStr;
  }
}

export default function ArchivePage(): React.JSX.Element {
  const [mounted, setMounted] = useState(false);
  const [dailyAttempts, setDailyAttempts] = useState<Record<string, DailyAttemptRecord>>({});
  const [todayStr, setTodayStr] = useState<string>("");

  useEffect(() => {
    const today = getDailyDateString();
    const progress = loadProgress();
    setTodayStr(today);
    setDailyAttempts(progress.daily);
    setMounted(true);
  }, []);

  const published = getPublishedDailySchedule();
  // Sort descending: newest date first
  const sortedSchedule = [...published].sort((a, b) => b.date.localeCompare(a.date));

  if (!mounted) {
    return (
      <div className="flex min-h-screen flex-col bg-[#fcfbf9]">
        <Header />
        <main className="mx-auto flex flex-1 w-full max-w-4xl flex-col items-center justify-center p-6">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-coral-500 border-t-transparent" />
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-stone-400">
            Loading Archive...
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#fcfbf9]">
      <Header />
      <main className="mx-auto flex flex-1 w-full max-w-4xl flex-col justify-between px-4 py-8 sm:px-8 sm:py-12">
        {/* Header */}
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
              <span>Daily Archive</span>
            </div>

            <Link
              href="/daily"
              className="inline-flex items-center gap-1.5 rounded-lg border border-coral-200 bg-coral-50 px-3 py-1.5 text-xs font-semibold text-coral-700 shadow-sm transition hover:bg-coral-100 active:scale-95"
            >
              <span>Today&apos;s Challenge</span>
            </Link>
          </div>

          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
              Challenge Archive
            </h1>
            <p className="mt-1 text-xs text-stone-500 sm:text-sm">
              Review past calendar challenges and track your daily solving history.
            </p>
          </div>
        </header>

        {/* Archive List */}
        <section className="my-8 w-full flex-1" aria-label="Published Daily Puzzles">
          <div className="space-y-3">
            {sortedSchedule.map((assignment) => {
              const puzzle = PUBLIC_PUZZLES_BY_ID.get(assignment.puzzleId);
              const attempt = dailyAttempts[assignment.date];
              const isToday = assignment.date === todayStr;

              return (
                <div
                  key={assignment.date}
                  data-testid={`archive-item-${assignment.date}`}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-stone-200/90 bg-white/80 p-5 shadow-xs transition hover:border-stone-300 hover:bg-white"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-stone-100 font-bold text-stone-700">
                      {assignment.date.slice(8, 10)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-stone-500">
                          {formatFriendlyDate(assignment.date)}
                        </span>
                        {isToday && (
                          <span className="rounded-full bg-coral-100 px-2 py-0.5 text-[10px] font-bold text-coral-800">
                            TODAY
                          </span>
                        )}
                        {assignment.note && (
                          <span className="text-xs text-stone-400">• {assignment.note}</span>
                        )}
                      </div>

                      <div className="mt-1 flex items-center gap-2">
                        <span className="font-extrabold text-stone-900 text-base">
                          {puzzle
                            ? `${puzzle.clueWords[0]} + ${puzzle.clueWords[1]}`
                            : assignment.puzzleId}
                        </span>
                        {puzzle && (
                          <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-600">
                            {puzzle.difficulty}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    {attempt ? (
                      <div className="flex items-center gap-2">
                        {attempt.status === "WON" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-bold text-emerald-800">
                            <Trophy className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                            <span>Solved ({attempt.finalScore} pts)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 border border-stone-200 px-2.5 py-1 text-xs font-semibold text-stone-700">
                            <Hourglass className="h-3.5 w-3.5 text-stone-500" aria-hidden="true" />
                            <span>Timed Out</span>
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-stone-400">Unplayed</span>
                    )}

                    {isToday ? (
                      <Link
                        href="/daily"
                        className="inline-flex items-center gap-1 rounded-xl bg-coral-500 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-coral-600 active:scale-95"
                      >
                        <span>{attempt ? "View Today" : "Play"}</span>
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer Notice */}
        <footer className="border-t border-stone-200/80 pt-4 text-center text-xs text-stone-500">
          <p>Flipped Daily Archive • Calendar days reset according to Asia/Kolkata timezone</p>
        </footer>
      </main>
      <Footer />
    </div>
  );
}
