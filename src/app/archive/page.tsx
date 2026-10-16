"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  getPublishedDailySchedule,
  getDailyDateString,
} from "@/features/game/modes/daily-scheduler";
import { PUBLIC_PUZZLES_BY_ID } from "@/features/game/data/public-puzzles";
import { loadProgress } from "@/features/game/persistence/local-progress";
import { syncUserProgress } from "@/features/game/persistence/user-sync";
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
  const { isSignedIn, user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [dailyAttempts, setDailyAttempts] = useState<Record<string, DailyAttemptRecord>>({});
  const [todayStr, setTodayStr] = useState<string>("");

  useEffect(() => {
    const activeId = isSignedIn && user?.id ? user.id : null;
    const today = getDailyDateString();
    const progress = loadProgress(activeId);
    setTodayStr(today);
    setDailyAttempts(progress.daily);
    setMounted(true);

    if (isSignedIn && user?.id) {
      syncUserProgress(user.id).then((res) => {
        if (res?.progress?.daily) {
          setDailyAttempts(res.progress.daily);
        }
      });
    }
  }, [isSignedIn, user?.id]);

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
        <header className="flex flex-col items-center gap-2 text-center pt-2 sm:pt-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#32171D] sm:text-4xl">
              Challenge Archive
            </h1>
            <p className="mt-1 text-xs text-[#6B4E55] sm:text-sm">
              Play past daily challenges and track your history. Completing past puzzles does not affect your daily streak or official statistics.
            </p>
          </div>
        </header>

        {/* Archive List */}
        <section className="my-4 w-full flex-1" aria-label="Published Daily Puzzles">
          <div className="space-y-2.5">
            {sortedSchedule.map((assignment) => {
              const puzzle = PUBLIC_PUZZLES_BY_ID.get(assignment.puzzleId);
              const attempt = dailyAttempts[assignment.date];
              const isToday = assignment.date === todayStr;
              const challengeNum = challengeNumberMap.get(assignment.date) ?? 1;
              const { dayName, formattedDate } = formatFriendlyDateWithDay(assignment.date);
              const monthShort = formattedDate.split(" ")[0]?.toUpperCase() || "OCT";

              return (
                <div
                  key={assignment.date}
                  data-testid={`archive-item-${assignment.date}`}
                  className={`flex items-center justify-between gap-3 rounded-2xl border bg-white p-3 sm:p-4 shadow-2xs transition-all duration-200 hover:border-[#7B1E2B] hover:shadow-xs ${
                    isToday
                      ? "border-[#7B1E2B]/70 ring-1 ring-[#7B1E2B]/20"
                      : "border-[#C49A6C]/45"
                  }`}
                >
                  {/* Left: Date Tile & Challenge Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Date Tile: 2-line day + month */}
                    <div
                      className={`flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 flex-col items-center justify-center rounded-xl border font-bold text-center leading-none ${
                        isToday
                          ? "bg-[#7B1E2B] text-[#F7F0E5] border-[#7B1E2B]"
                          : "bg-[#faeee0] text-[#32171D] border-[#C49A6C]/50"
                      }`}
                    >
                      <span className="text-sm sm:text-base font-black">
                        {assignment.date.slice(8, 10)}
                      </span>
                      <span
                        className={`text-[9px] font-extrabold tracking-wide uppercase ${
                          isToday ? "text-[#F7F0E5]/80" : "text-[#8C6D68]"
                        }`}
                      >
                        {monthShort}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-[#32171D] text-sm sm:text-base leading-tight">
                          Challenge #{challengeNum}
                        </span>
                        {puzzle && (
                          <span className="rounded bg-[#faeee0] border border-[#C49A6C]/40 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-extrabold text-[#7B1E2B] uppercase">
                            {puzzle.difficulty}
                          </span>
                        )}
                        {isToday && (
                          <span className="rounded-full bg-[#7B1E2B] px-2 py-0.5 text-[9px] font-extrabold text-[#F7F0E5]">
                            TODAY
                          </span>
                        )}
                      </div>

                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[#8C6D68] truncate">
                        <span className="truncate">{dayName}, {formattedDate}</span>
                        {attempt && attempt.status === "WON" ? (
                          <span className="font-bold text-[#7B1E2B] shrink-0">
                            • Solved ({attempt.finalScore} pts)
                          </span>
                        ) : attempt ? (
                          <span className="font-medium text-[#8C6D68] shrink-0">
                            • Completed (Timed Out)
                          </span>
                        ) : (
                          <span className="text-[#8C6D68]/70 shrink-0">
                            • Unplayed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Vertically Centered Action Button */}
                  <div className="shrink-0">
                    <Link
                      href={isToday ? "/daily" : `/daily?date=${assignment.date}`}
                      className={`inline-flex items-center justify-center rounded-full px-4 sm:px-5 py-1.5 sm:py-2 text-xs font-bold shadow-xs transition-all duration-200 ease-out active:scale-[0.96] ${
                        attempt
                          ? "bg-[#faeee0] border border-[#C49A6C] text-[#32171D] hover:bg-[#f4ddc5]"
                          : "bg-[#7B1E2B] text-[#F7F0E5] hover:bg-[#631722]"
                      }`}
                    >
                      <span>{attempt ? "View" : "Play"}</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
