"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Trophy,
  Flame,
  Clock,
  ArrowRight,
  BookOpen,
  Hourglass,
  X,
} from "lucide-react";
import { Show, SignInButton } from "@clerk/nextjs";
import { Header } from "@/components/Header";
import { AcidSquares } from "@/components/AcidSquares";
import DecryptedText from "@/components/DecryptedText";
import { Footer } from "@/components/Footer";
import { FlippedSymbol } from "@/components/FlippedLogo";
import { loadProgress } from "@/features/game/persistence/local-progress";
import { getDailyDateString, getDailyScheduleStatus } from "@/features/game/modes/daily-scheduler";
import { calculateDailyStreaks } from "@/features/game/modes/statistics";
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

    const interval = setInterval(() => {
      setTimeUntilNext(getTimeUntilMidnightIST());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const dailyScheduleStatus = todayDateStr ? getDailyScheduleStatus(todayDateStr) : "AVAILABLE";
  const isDailyAvailable = dailyScheduleStatus === "AVAILABLE";

  const handleScrollToHowToPlay = () => {
    const el = document.getElementById("how-to-play");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="home-page flex min-h-screen flex-col">
      <AcidSquares className="home-acid-background" color="#F7F0E5" accentColor="#C49A6C" />
      <Header />

      <main className="mx-auto flex flex-1 w-full max-w-4xl flex-col px-4 py-8 sm:px-6 sm:py-12">
        {/* Hero Section */}
        <section className="text-center space-y-4 my-4 sm:my-8" aria-label="Game Introduction">
          <div className="flex justify-center">
            <FlippedSymbol size={64} variant="crimson" />
          </div>

          <h1
            aria-label="FLIPPED"
            className="home-wordmark text-4xl font-black tracking-tight text-[#32171D] sm:text-5xl md:text-6xl"
          >
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

            <button
              type="button"
              onClick={handleScrollToHowToPlay}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-[#C49A6C] bg-white px-5 py-3.5 text-sm font-bold text-[#32171D] shadow-xs hover:bg-[#faeee0] transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B1E2B]"
            >
              <BookOpen className="h-4 w-4 text-[#7B1E2B]" aria-hidden="true" />
              <span>How to Play</span>
            </button>
          </div>

          <Show when="signed-out">
            <div className="flex items-center justify-center gap-1.5 text-xs text-[#8C6870] pt-1">
              <span>Play without logging in, or</span>
              <SignInButton mode="modal">
                <button type="button" className="font-bold text-[#7B1E2B] hover:underline cursor-pointer">
                  Log in / Create account
                </button>
              </SignInButton>
              <span>to sync your streak</span>
            </div>
          </Show>
        </section>

        {/* Daily Challenge Primary Card */}
        <section className="my-6" aria-label="Daily Challenge">
          <article
            data-testid="home-daily-card"
            className="flex flex-col justify-between rounded-3xl border border-[#C49A6C]/60 bg-white p-6 sm:p-8 shadow-xs hover:border-[#7B1E2B]/50 transition"
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#faeee0] text-[#7B1E2B]">
                    <Calendar className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#7B1E2B]">
                      Synchronized Global Challenge
                    </span>
                    <h2 className="text-2xl font-black text-[#32171D]">Daily Mode</h2>
                  </div>
                </div>

                {mounted && (
                  <div>
                    {todayAttempt ? (
                      todayAttempt.status === "WON" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#C49A6C] px-3.5 py-1 text-xs font-bold text-[#32171D]">
                          <Trophy className="h-3.5 w-3.5 text-[#32171D]" />
                          <span>Solved ({todayAttempt.finalScore} pts)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#C49A6C] bg-[#faeee0] px-3.5 py-1 text-xs font-semibold text-[#32171D]">
                          <Hourglass className="h-3.5 w-3.5 text-[#8C6870]" />
                          <span>Timed Out</span>
                        </span>
                      )
                    ) : isDailyAvailable ? (
                      <span className="rounded-full border border-[#C49A6C] bg-[#faeee0] px-3.5 py-1 text-xs font-bold text-[#7B1E2B]">
                        Available Today
                      </span>
                    ) : (
                      <span className="rounded-full border border-[#C49A6C]/40 bg-[#faeee0] px-3.5 py-1 text-xs font-medium text-[#8C6870]">
                        Unavailable
                      </span>
                    )}
                  </div>
                )}
              </div>

              <p className="mt-4 text-sm text-[#6B4E55] leading-relaxed">
                One canonical puzzle per day synchronized globally. Decrypt the clues and fill the
                board before the authoritative 60-second timer expires.
              </p>

              {/* Highlights */}
              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-[#C49A6C]/20 pt-4 text-xs">
                <div className="rounded-2xl border border-[#C49A6C]/30 bg-[#faeee0]/50 p-3.5">
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

                <div className="rounded-2xl border border-[#C49A6C]/30 bg-[#faeee0]/50 p-3.5">
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

            <div className="mt-6 pt-4 border-t border-[#C49A6C]/20 flex flex-col items-center gap-2.5">
              <Link
                href="/daily"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#7B1E2B] px-5 py-3.5 text-sm font-bold text-[#F7F0E5] shadow-xs hover:bg-[#631722] transition active:scale-95"
              >
                <span>{todayAttempt ? "View Today's Result" : "Play Daily Challenge"}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Show when="signed-out">
                <div className="flex items-center gap-1.5 text-xs text-[#8C6870]">
                  <span>Playing as guest •</span>
                  <SignInButton mode="modal">
                    <button type="button" className="font-bold text-[#7B1E2B] hover:underline cursor-pointer">
                      Log in / Create account to sync your streak
                    </button>
                  </SignInButton>
                </div>
              </Show>
              <Show when="signed-in">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  <span>Logged in • Streaks and stats sync automatically</span>
                </div>
              </Show>
            </div>
          </article>
        </section>

        {/* How It Works & Transformation Permutations Guide */}
        <section
          id="how-to-play"
          className="my-6 scroll-mt-24 rounded-3xl border border-[#C49A6C]/60 bg-white p-6 sm:p-8 shadow-xs"
          aria-label="How Flipped Works"
        >
          <div className="border-b border-[#C49A6C]/20 pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7B1E2B]">
              Game Rules & Strategy
            </span>
            <h2 className="text-2xl font-black text-[#32171D] mt-0.5">How Flipped Works</h2>
            <p className="mt-2 text-sm text-[#6B4E55] leading-relaxed">
              In Flipped, each puzzle presents you with two clue words. Together, they transform
              into a familiar two-word phrase (such as <em>ICE CREAM</em> or <em>DEEP SLEEP</em>).
            </p>
          </div>

          {/* The 4 Permutations */}
          <div className="mt-6">
            <h3 className="text-sm font-extrabold text-[#32171D] uppercase tracking-wider">
              The 4 Possible Transformation Combinations
            </h3>
            <p className="mt-1 text-xs text-[#6B4E55]">
              The clue words do <strong>not</strong> reveal whether they are synonyms or antonyms.
              You must deduce which of the 4 combinations applies:
            </p>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[#C49A6C]/40 bg-[#faeee0]/60 p-4">
                <span className="text-xs font-bold text-[#7B1E2B]">1. Synonym + Antonym</span>
                <p className="mt-1 text-xs text-[#6B4E55]">
                  Word 1 has a similar meaning; Word 2 has the opposite meaning.
                </p>
              </div>

              <div className="rounded-2xl border border-[#C49A6C]/40 bg-[#faeee0]/60 p-4">
                <span className="text-xs font-bold text-[#7B1E2B]">2. Antonym + Synonym</span>
                <p className="mt-1 text-xs text-[#6B4E55]">
                  Word 1 has the opposite meaning; Word 2 has a similar meaning.
                </p>
              </div>

              <div className="rounded-2xl border border-[#C49A6C]/40 bg-[#faeee0]/60 p-4">
                <span className="text-xs font-bold text-[#7B1E2B]">3. Synonym + Synonym</span>
                <p className="mt-1 text-xs text-[#6B4E55]">
                  Both clue words transform into words with similar meanings.
                </p>
              </div>

              <div className="rounded-2xl border border-[#C49A6C]/40 bg-[#faeee0]/60 p-4">
                <span className="text-xs font-bold text-[#7B1E2B]">4. Antonym + Antonym</span>
                <p className="mt-1 text-xs text-[#6B4E55]">
                  Both clue words transform into words with opposite meanings.
                </p>
              </div>
            </div>
          </div>

          {/* How Letters & Gameplay Work */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[#C49A6C]/20 pt-6">
            <div className="rounded-2xl border border-[#C49A6C]/30 bg-[#faeee0]/40 p-4">
              <span className="text-xs font-bold text-[#7B1E2B]">1. Starting Clues</span>
              <p className="mt-1.5 text-xs text-[#6B4E55] leading-relaxed">
                You receive two clue words. The first letter of each answer is permanently fixed as
                a starting anchor.
              </p>
              <div className="mt-3 rounded-xl border border-[#C49A6C]/40 bg-white p-2.5 text-center font-black text-sm text-[#32171D]">
                SLOW + MEAL
              </div>
            </div>

            <div className="rounded-2xl border border-[#C49A6C]/30 bg-[#faeee0]/40 p-4">
              <span className="text-xs font-bold text-[#7B1E2B]">2. Wrong Letter Feedback</span>
              <p className="mt-1.5 text-xs text-[#6B4E55] leading-relaxed">
                Type letters to fill the grid. If any letter is incorrect, it is marked as wrong
                with a dashed crimson outline, strikethrough, and X icon.
              </p>
              <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#7B1E2B] bg-[#7B1E2B]/10 p-2 text-center text-xs font-bold text-[#7B1E2B]">
                <X className="h-4 w-4" />
                <span className="line-through">Wrong Letter Marked</span>
              </div>
            </div>

            <div className="rounded-2xl border border-[#C49A6C]/30 bg-[#faeee0]/40 p-4">
              <span className="text-xs font-bold text-[#7B1E2B]">
                3. Automatic Victory & Pop-up
              </span>
              <p className="mt-1.5 text-xs text-[#6B4E55] leading-relaxed">
                As soon as all the correct letters are entered, the game immediately finishes and
                your victory pop-up appears with explanations!
              </p>
              <div className="mt-3 rounded-xl border border-[#C49A6C] bg-[#32171D] p-2.5 text-center font-black text-sm text-[#F7F0E5]">
                FAST FOOD
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
