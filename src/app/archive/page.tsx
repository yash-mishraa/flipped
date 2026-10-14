"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  getPublishedDailySchedule,
  getDailyDateString,
} from "@/features/game/modes/daily-scheduler";
import { PUBLIC_PUZZLES_BY_ID } from "@/features/game/data/public-puzzles";
import { loadProgress } from "@/features/game/persistence/local-progress";
import type { DailyAttemptRecord } from "@/features/game/modes/mode-types";

function formatFriendlyDateWithDay(dateStr: string): { dayName: string; formattedDate: string } {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    if (!year || !month || !day) return { dayName: "", formattedDate: dateStr };
    const date = new Date(year, month - 1, day);
    const dayName = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
    const formattedDate = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
    return { dayName, formattedDate };
  } catch {
    return { dayName: "", formattedDate: dateStr };
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

  const currentToday = todayStr || getDailyDateString();
  const published = getPublishedDailySchedule(currentToday);
  // Map date to chronological challenge number (Challenge #1 = earliest date)
  const challengeNumberMap = new Map<string, number>();
  published.forEach((a, idx) => challengeNumberMap.set(a.date, idx + 1));

  // Sort descending: newest date first, strictly up to today
  const sortedSchedule = [...published]
    .filter((a) => a.date <= currentToday)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (!mounted) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-[#F7F0E5]">
        <Header />
        <main className="mx-auto flex flex-1 w-full max-w-4xl flex-col items-center justify-center p-6">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7B1E2B] border-t-transparent" />
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6B4E55]">
            Loading Archive...
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#F7F0E5]">
      <Header />
      <main className="mx-auto flex flex-1 w-full max-w-4xl flex-col gap-4 px-4 py-4 sm:px-8 sm:py-6">
        {/* Header */}
        <header className="flex flex-col items-center gap-3 text-center">
          <div className="flex w-full items-center justify-between border-b border-[#C49A6C]/30 pb-3">
            <Link
              href="/"
              className="rounded-full border border-[#C49A6C]/60 bg-white/90 px-4 py-1.5 text-xs font-semibold text-[#32171D] shadow-xs transition-all duration-200 ease-out hover:bg-[#faeee0] active:scale-[0.96]"
            >
              Home
            </Link>

            <span className="rounded-full border border-[#C49A6C] bg-[#faeee0] px-4 py-1.5 text-xs font-semibold text-[#7B1E2B]">
              Daily Archive
            </span>

            <Link
              href="/daily"
              className="rounded-full bg-[#7B1E2B] px-4 py-1.5 text-xs font-bold text-[#F7F0E5] shadow-xs transition-all duration-200 ease-out hover:opacity-90 hover:shadow-sm active:scale-[0.96]"
            >
              Today
            </Link>
          </div>

          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#32171D] sm:text-4xl">
              Challenge Archive
            </h1>
            <p className="mt-1 text-xs text-[#6B4E55] sm:text-sm">
              Play past daily challenges and track your history. Completing past puzzles does not affect your daily streak.
            </p>
          </div>
        </header>

        {/* Archive List */}
        <section className="my-4 w-full flex-1" aria-label="Published Daily Puzzles">
          <div className="space-y-3">
            {sortedSchedule.map((assignment) => {
              const puzzle = PUBLIC_PUZZLES_BY_ID.get(assignment.puzzleId);
              const attempt = dailyAttempts[assignment.date];
              const isToday = assignment.date === todayStr;
              const challengeNum = challengeNumberMap.get(assignment.date) ?? 1;
              const { dayName, formattedDate } = formatFriendlyDateWithDay(assignment.date);

              return (
                <div
                  key={assignment.date}
                  data-testid={`archive-item-${assignment.date}`}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-[#C49A6C]/40 bg-white/80 p-5 shadow-xs transition hover:border-[#7B1E2B] hover:bg-white"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#faeee0] font-bold text-[#32171D]">
                      {assignment.date.slice(8, 10)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#6B4E55]">
                          {dayName} • {formattedDate}
                        </span>
                        {isToday && (
                          <span className="rounded-full bg-[#7B1E2B] px-2 py-0.5 text-[10px] font-bold text-[#F7F0E5]">
                            TODAY
                          </span>
                        )}
                        {assignment.note && (
                          <span className="text-xs text-[#8C6D68]">• {assignment.note}</span>
                        )}
                      </div>

                      <div className="mt-1 flex items-center gap-2">
                        <span className="font-extrabold text-[#32171D] text-base">
                          Challenge #{challengeNum}
                        </span>
                        {puzzle && (
                          <span className="rounded bg-[#faeee0] border border-[#C49A6C]/40 px-1.5 py-0.5 text-[10px] font-bold text-[#7B1E2B]">
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
                          <span className="rounded-full bg-[#faeee0] border border-[#C49A6C] px-3 py-1 text-xs font-bold text-[#32171D]">
                            Solved ({attempt.finalScore} pts)
                          </span>
                        ) : (
                          <span className="rounded-full bg-[#faeee0]/50 border border-[#C49A6C]/40 px-3 py-1 text-xs font-semibold text-[#6B4E55]">
                            Timed Out
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-[#8C6D68]">Unplayed</span>
                    )}

                    <Link
                      href={isToday ? "/daily" : `/daily?date=${assignment.date}`}
                      className="rounded-full bg-[#7B1E2B] px-5 py-2 text-xs font-bold text-[#F7F0E5] shadow-xs transition-all duration-200 ease-out hover:bg-[#631722] hover:shadow-sm active:scale-[0.96]"
                    >
                      <span>{attempt ? (attempt.status === "WON" ? "View" : "Replay") : "Play"}</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer Notice */}
        <footer className="border-t border-[#C49A6C]/30 pt-3 text-center text-xs text-[#6B4E55]">
          <p>Flipped Daily Archive • Calendar days reset according to Asia/Kolkata timezone</p>
        </footer>
      </main>
      <Footer />
    </div>
  );
}
