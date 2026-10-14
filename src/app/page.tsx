"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Compass,
  Trophy,
  Flame,
  Clock,
  Sparkles,
  ArrowRight,
  BookOpen,
  BarChart2,
  Archive,
  Hourglass,
} from "lucide-react";
import { Header } from "@/components/Header";
import { AcidSquares } from "@/components/AcidSquares";
import DecryptedText from "@/components/DecryptedText";
import { Footer } from "@/components/Footer";
import { TutorialModal } from "@/features/game/components/TutorialModal";
import { loadProgress, isOnboardingCompleted } from "@/features/game/persistence/local-progress";
import { getDailyDateString, getDailyScheduleStatus } from "@/features/game/modes/daily-scheduler";
import { calculateDailyStreaks } from "@/features/game/modes/statistics";
import { getPuzzleCountsByDifficulty } from "@/features/game/data/public-puzzles";
import type { DailyAttemptRecord } from "@/features/game/modes/mode-types";

function getTimeUntilMidnightIST(): string {
  const now = Date.now();
  // Asia/Kolkata is UTC+5:30 = 19,800,000 ms offset
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istNow = now + istOffsetMs;
  const oneDayMs = 24 * 60 * 60 * 1000;
  const msIntoDay = istNow % oneDayMs;
  const msRemaining = oneDayMs - msIntoDay;

  const hours = Math.floor(msRemaining / (60 * 60 * 1000));
  const minutes = Math.floor((msRemaining % (60 * 60 * 1000)) / (60 * 1000));

  return `${hours}h ${minutes}m`;
}

export default function HomePage(): React.JSX.Element {
  const [mounted, setMounted] = useState(false);
  const [todayAttempt, setTodayAttempt] = useState<DailyAttemptRecord | null>(null);
  const [todayDateStr, setTodayDateStr] = useState<string>("");
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [timeUntilNext, setTimeUntilNext] = useState<string>("");
  const [tutorialOpen, setTutorialOpen] = useState(false);

  const puzzleCounts = getPuzzleCountsByDifficulty();

  useEffect(() => {
    const today = getDailyDateString();
    const progress = loadProgress();
    const attempt = progress.daily[today] ?? null;
    const streaks = calculateDailyStreaks(progress.daily, today);

    setTodayDateStr(today);
    setTodayAttempt(attempt);
    setCurrentStreak(streaks.currentStreak);
    setTimeUntilNext(getTimeUntilMidnightIST());
    setMounted(true);

    // If first-time visitor, show onboarding tutorial automatically
    if (!isOnboardingCompleted()) {
      setTutorialOpen(true);
    }

    // Refresh countdown every minute
    const interval = setInterval(() => {
      setTimeUntilNext(getTimeUntilMidnightIST());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const dailyScheduleStatus = todayDateStr ? getDailyScheduleStatus(todayDateStr) : "AVAILABLE";
  const isDailyAvailable = dailyScheduleStatus === "AVAILABLE";

  return (
    <div className="home-page flex min-h-screen flex-col">
      <AcidSquares className="home-acid-background" color="#F7F0E5" accentColor="#C49A6C" />
      <Header />

      <main className="mx-auto flex flex-1 w-full max-w-5xl flex-col px-4 py-8 sm:px-6 sm:py-12">
        {/* Hero Section */}
        <section className="text-center space-y-4 my-4 sm:my-8" aria-label="Game Introduction">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#C49A6C] bg-[#faeee0] px-3.5 py-1 text-xs font-semibold text-[#7B1E2B]">
            <Sparkles className="h-3.5 w-3.5 text-[#7B1E2B]" aria-hidden="true" />
            <span>The Daily Mental Deduction Challenge</span>
          </div>

          <h1 aria-label="FLIPPED" className="home-wordmark text-4xl font-black tracking-tight text-[#32171D] sm:text-5xl md:text-6xl">
            <DecryptedText
              text="FLIPPED"
              animateOn="view"
              sequential
              revealDirection="center"
              speed={75}
              className="wordmark-letter"
              encryptedClassName="wordmark-encrypted"
              parentClassName="wordmark-animation"
            />
          </h1>

          <p className="mx-auto max-w-xl text-base sm:text-lg text-[#6B4E55] leading-relaxed">
            Flip the meanings of two clue words to uncover a familiar phrase. Fill the letter grid
            before your 60-second timer runs out.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/daily"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#7B1E2B] px-6 py-3.5 text-sm font-bold text-[#F7F0E5] shadow-md hover:bg-[#631722] transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B1E2B]"
            >
              <Calendar className="h-4 w-4" aria-hidden="true" />
              <span>{todayAttempt ? "View Today's Result" : "Play Daily Challenge"}</span>
            </Link>

            <Link
              href="/classic"
              className="inline-flex items-center gap-2 rounded-2xl border border-[#C49A6C] bg-white px-6 py-3.5 text-sm font-bold text-[#32171D] shadow-xs hover:bg-[#faeee0] transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B1E2B]"
            >
              <Compass className="h-4 w-4 text-[#C49A6C]" aria-hidden="true" />
              <span>Classic Practice</span>
            </Link>

            <button
              type="button"
              onClick={() => setTutorialOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-[#C49A6C]/60 bg-white/60 px-4 py-3.5 text-sm font-semibold text-[#32171D] hover:bg-white hover:text-[#7B1E2B] transition active:scale-95"
            >
              <BookOpen className="h-4 w-4 text-[#7B1E2B]" aria-hidden="true" />
              <span>How to Play</span>
            </button>
          </div>
        </section>

        {/* Primary Modes Section */}
        <section className="my-8 grid grid-cols-1 md:grid-cols-2 gap-6" aria-label="Game Modes">
          {/* Daily Challenge Card */}
          <article
            data-testid="home-daily-card"
            className="flex flex-col justify-between rounded-3xl border border-[#C49A6C]/60 bg-white p-6 sm:p-8 shadow-xs hover:border-[#7B1E2B]/50 transition"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#faeee0] text-[#7B1E2B]">
                    <Calendar className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#7B1E2B]">
                      Synchronized Challenge
                    </span>
                    <h2 className="text-2xl font-black text-[#32171D]">Daily Mode</h2>
                  </div>
                </div>

                {mounted && (
                  <div>
                    {todayAttempt ? (
                      todayAttempt.status === "WON" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#C49A6C] px-3 py-1 text-xs font-bold text-[#32171D]">
                          <Trophy className="h-3.5 w-3.5 text-[#32171D]" />
                          <span>Solved ({todayAttempt.finalScore} pts)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#C49A6C] bg-[#faeee0] px-3 py-1 text-xs font-semibold text-[#32171D]">
                          <Hourglass className="h-3.5 w-3.5 text-[#8C6870]" />
                          <span>Timed Out</span>
                        </span>
                      )
                    ) : isDailyAvailable ? (
                      <span className="rounded-full border border-[#C49A6C] bg-[#faeee0] px-3 py-1 text-xs font-bold text-[#7B1E2B]">
                        Available Today
                      </span>
                    ) : (
                      <span className="rounded-full border border-[#C49A6C]/40 bg-[#faeee0] px-3 py-1 text-xs font-medium text-[#8C6870]">
                        Unavailable
                      </span>
                    )}
                  </div>
                )}
              </div>

              <p className="mt-4 text-sm text-[#6B4E55] leading-relaxed">
                One canonical challenge per day for all players globally. Solved against a strict
                60-second clock with a single official scored attempt.
              </p>

              {/* Daily Highlights */}
              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-[#C49A6C]/20 pt-4 text-xs">
                <div className="rounded-xl border border-[#C49A6C]/30 bg-[#faeee0]/50 p-3">
                  <span className="font-semibold text-[#8C6870] text-[11px] uppercase">
                    Current Streak
                  </span>
                  <div className="mt-1 flex items-center gap-1.5 font-black text-[#32171D] text-lg">
                    <Flame
                      className={`h-4 w-4 ${
                        currentStreak > 0 ? "text-[#7B1E2B]" : "text-[#C49A6C]/40"
                      }`}
                    />
                    <span>
                      {currentStreak} {currentStreak === 1 ? "day" : "days"}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-[#C49A6C]/30 bg-[#faeee0]/50 p-3">
                  <span className="font-semibold text-[#8C6870] text-[11px] uppercase">
                    Next Challenge
                  </span>
                  <div className="mt-1 flex items-center gap-1.5 font-black text-[#32171D] text-lg">
                    <Clock className="h-4 w-4 text-[#C49A6C]" />
                    <span>{timeUntilNext || "Midnight IST"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#C49A6C]/20">
              <Link
                href="/daily"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#7B1E2B] px-5 py-3.5 text-sm font-bold text-[#F7F0E5] shadow-xs hover:bg-[#631722] transition active:scale-95"
              >
                <span>{todayAttempt ? "View Today's Result" : "Play Daily Challenge"}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </article>

          {/* Classic Practice Card */}
          <article
            data-testid="home-classic-card"
            className="flex flex-col justify-between rounded-3xl border border-[#C49A6C]/60 bg-white p-6 sm:p-8 shadow-xs hover:border-[#7B1E2B]/50 transition"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#faeee0] text-[#C49A6C]">
                    <Compass className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8C6870]">
                      Unlimited Practice
                    </span>
                    <h2 className="text-2xl font-black text-[#32171D]">Classic Mode</h2>
                  </div>
                </div>

                <span className="rounded-full border border-[#C49A6C] bg-[#faeee0] px-3 py-1 text-xs font-bold text-[#32171D]">
                  Unlimited
                </span>
              </div>

              <p className="mt-4 text-sm text-[#6B4E55] leading-relaxed">
                Hone your word deduction skills without time locks. Play across Easy, Medium, and
                Hard tiers with automatic repetition prevention.
              </p>

              {/* Available Tiers Breakdown */}
              <div className="mt-6 border-t border-[#C49A6C]/20 pt-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6870]">
                  Available Tiers
                </span>
                <div className="mt-2.5 grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-[#C49A6C]/30 bg-[#faeee0]/50 p-2.5 text-center">
                    <span className="font-bold text-[#32171D] text-xs">Easy</span>
                    <p className="text-[10px] text-[#6B4E55] mt-0.5">{puzzleCounts.EASY} puzzles</p>
                  </div>
                  <div className="rounded-xl border border-[#C49A6C]/30 bg-[#faeee0]/50 p-2.5 text-center">
                    <span className="font-bold text-[#32171D] text-xs">Medium</span>
                    <p className="text-[10px] text-[#6B4E55] mt-0.5">
                      {puzzleCounts.MEDIUM} puzzles
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#C49A6C]/30 bg-[#faeee0]/50 p-2.5 text-center">
                    <span className="font-bold text-[#7B1E2B] text-xs">Hard</span>
                    <p className="text-[10px] text-[#6B4E55] mt-0.5">{puzzleCounts.HARD} puzzles</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#C49A6C]/20">
              <Link
                href="/classic"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#C49A6C] bg-white px-5 py-3.5 text-sm font-bold text-[#32171D] shadow-2xs hover:bg-[#faeee0] transition active:scale-95"
              >
                <span>Start Classic Practice</span>
                <ArrowRight className="h-4 w-4 text-[#C49A6C]" />
              </Link>
            </div>
          </article>
        </section>

        {/* How It Works Section */}
        <section
          className="my-6 rounded-3xl border border-[#C49A6C]/60 bg-white p-6 sm:p-8 shadow-xs"
          aria-label="How Flipped Works"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#C49A6C]/20 pb-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#7B1E2B]">
                Core Game Mechanics
              </span>
              <h2 className="text-2xl font-black text-[#32171D] mt-0.5">How Flipped Works</h2>
            </div>

            <button
              type="button"
              onClick={() => setTutorialOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#C49A6C] px-3.5 py-1.5 text-xs font-semibold text-[#32171D] hover:bg-[#faeee0] transition"
            >
              <BookOpen className="h-3.5 w-3.5 text-[#7B1E2B]" />
              <span>Interactive Tutorial</span>
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-[#C49A6C]/30 bg-[#faeee0]/50 p-4">
              <span className="text-xs font-bold text-[#7B1E2B]">1. Two Clue Words</span>
              <p className="mt-1.5 text-xs text-[#6B4E55] leading-relaxed">
                You receive two starting clues hinting at an everyday two-word phrase.
              </p>
              <div className="mt-3 rounded-lg border border-[#C49A6C]/40 bg-white p-2.5 text-center font-black text-sm text-[#32171D]">
                SLOW + MEAL
              </div>
            </div>

            <div className="rounded-2xl border border-[#C49A6C]/30 bg-[#faeee0]/50 p-4">
              <span className="text-xs font-bold text-[#7B1E2B]">2. Semantic Transformations</span>
              <p className="mt-1.5 text-xs text-[#6B4E55] leading-relaxed">
                Each clue word transforms into its <strong>ANTONYM</strong> (opposite) or{" "}
                <strong>SYNONYM</strong> (similar).
              </p>
              <div className="mt-3 space-y-1 text-[11px] font-bold text-[#32171D]">
                <div className="flex justify-between rounded bg-white p-1 px-2 border border-[#C49A6C]/30">
                  <span>SLOW → FAST</span>
                  <span className="text-[#7B1E2B]">Antonym</span>
                </div>
                <div className="flex justify-between rounded bg-white p-1 px-2 border border-[#C49A6C]/30">
                  <span>MEAL → FOOD</span>
                  <span className="text-[#8C6870]">Synonym</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#C49A6C]/30 bg-[#faeee0]/50 p-4">
              <span className="text-xs font-bold text-[#7B1E2B]">
                3. Automatic Answer Detection
              </span>
              <p className="mt-1.5 text-xs text-[#6B4E55] leading-relaxed">
                The first letter of each answer is revealed. Fill the remaining tiles—answers
                auto-detect the moment they are complete!
              </p>
              <div className="mt-3 rounded-lg border border-[#C49A6C] bg-[#faeee0] p-2.5 text-center font-black text-sm text-[#32171D]">
                FAST FOOD
              </div>
            </div>
          </div>
        </section>

        {/* Quick Links Row: Archive & Statistics */}
        <section className="my-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/archive"
            className="flex items-center justify-between rounded-2xl border border-[#C49A6C]/40 bg-white/70 p-5 shadow-2xs hover:border-[#7B1E2B] hover:bg-white transition group"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#faeee0] text-[#7B1E2B] group-hover:bg-[#7B1E2B] group-hover:text-[#F7F0E5] transition">
                <Archive className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#32171D] text-sm">Challenge Archive</h3>
                <p className="text-xs text-[#6B4E55]">Review past daily assignments</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-[#C49A6C] group-hover:text-[#7B1E2B] group-hover:translate-x-0.5 transition" />
          </Link>

          <Link
            href="/stats"
            className="flex items-center justify-between rounded-2xl border border-[#C49A6C]/40 bg-white/70 p-5 shadow-2xs hover:border-[#7B1E2B] hover:bg-white transition group"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#faeee0] text-[#7B1E2B] group-hover:bg-[#7B1E2B] group-hover:text-[#F7F0E5] transition">
                <BarChart2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#32171D] text-sm">Player Statistics</h3>
                <p className="text-xs text-[#6B4E55]">Track streaks, win rate, and solve times</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-[#C49A6C] group-hover:text-[#7B1E2B] group-hover:translate-x-0.5 transition" />
          </Link>
        </section>
      </main>

      <Footer />

      {/* Interactive Onboarding Tutorial */}
      <TutorialModal isOpen={tutorialOpen} onClose={() => setTutorialOpen(false)} />
    </div>
  );
}
