"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { SignInButton, useUser } from "@clerk/nextjs";
import { Header } from "@/components/Header";
import { AcidSquares } from "@/components/AcidSquares";
import DecryptedText from "@/components/DecryptedText";
import { Footer } from "@/components/Footer";
import { FlippedSymbol } from "@/components/FlippedLogo";
import { SplashIntro } from "@/components/SplashIntro";
import { TutorialModal } from "@/features/game/components/TutorialModal";
import { ShinyButton } from "@/components/ui/shiny-button";
import { loadProgress, setActiveUser } from "@/features/game/persistence/local-progress";
import { getDailyDateString } from "@/features/game/modes/daily-scheduler";
import { calculateDailyStreaks } from "@/features/game/modes/statistics";
import { syncUserProgress } from "@/features/game/persistence/user-sync";
import type { DailyAttemptRecord } from "@/features/game/modes/mode-types";

export default function HomePage(): React.JSX.Element {
  const { user, isSignedIn } = useUser();
  const [todayAttempt, setTodayAttempt] = useState<DailyAttemptRecord | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [streak, setStreak] = useState<number>(0);
  const [isRecurringUser, setIsRecurringUser] = useState<boolean>(false);

  useEffect(() => {
    const activeId = isSignedIn && user?.id ? user.id : null;
    setActiveUser(activeId);

    const today = getDailyDateString();
    const progress = loadProgress(activeId);
    const attempt = progress.daily[today] ?? null;
    setTodayAttempt(attempt);

    // Check if player has played any daily challenges in the past under current identity
    const dailyAttempts = Object.values(progress.daily);
    const playedCount = dailyAttempts.length;
    const { currentStreak } = calculateDailyStreaks(progress.daily, today);

    if (playedCount > 0) {
      setIsRecurringUser(true);
      setStreak(currentStreak);
    } else {
      setIsRecurringUser(false);
      setStreak(0);
    }

    // If authenticated, sync with cloud database to guarantee up-to-date streak
    if (isSignedIn && user?.id) {
      syncUserProgress(user.id).then((result) => {
        if (result?.stats?.daily) {
          const cloudPlayed = result.stats.daily.totalPlayed;
          if (cloudPlayed > 0) {
            setIsRecurringUser(true);
            setStreak(result.stats.daily.currentStreak);
          } else {
            setIsRecurringUser(false);
            setStreak(0);
          }
          const updatedAttempt = result.progress.daily[today] ?? null;
          setTodayAttempt(updatedAttempt);
        }
      });
    }
  }, [isSignedIn, user?.id]);

  return (
    <div className="home-page flex min-h-[100dvh] flex-col">
      <SplashIntro />
      <AcidSquares className="home-acid-background" color="#F7F0E5" accentColor="#C49A6C" />
      <Header />

      <main className="mx-auto flex flex-1 w-full max-w-md flex-col items-center justify-center px-4 py-4 sm:py-8">
        {/* Streamlined Hero Section */}
        <section
          className="w-full text-center space-y-3 max-w-sm mx-auto"
          aria-label="Game Introduction"
        >
          <div className="flex justify-center">
            <FlippedSymbol size={56} variant="crimson" />
          </div>

          <h1
            aria-label="FLIPPED"
            className="home-wordmark text-3xl font-black tracking-tight text-[#32171D] sm:text-5xl"
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

          <p className="mx-auto max-w-xs text-sm sm:text-base text-[#6B4E55] leading-relaxed">
            Flip the meanings of two clue words to uncover a familiar phrase. Fill the letter grid
            before your 60-second timer runs out.
          </p>

          {/* Action Buttons: Play Daily Challenge (ShinyButton), How to Play (Apple UI), Log In / Create Account (ShinyButton) */}
          <div className="mx-auto flex w-full max-w-xs flex-col gap-2.5 pt-2">
            {/* Recurring User Streak Pill — Wordle-style, only shown for returning players */}
            {isRecurringUser && (
              <div
                data-testid="home-daily-streak"
                className="inline-flex items-center justify-center gap-1.5 self-center rounded-full border border-[#C49A6C]/60 bg-[#faeee0] px-4 py-1 text-xs font-bold text-[#7B1E2B] shadow-2xs animate-fade-in"
              >
                <span className="text-[#32171D]">Daily Streak:</span>
                <span className="text-sm font-black text-[#7B1E2B]">{streak}</span>
                <span className="text-[10px] uppercase tracking-wide text-[#8C6870]">
                  {streak === 1 ? "Day" : "Days"}
                </span>
              </div>
            )}

            <Link href="/daily" className="w-full block">
              <ShinyButton
                label={todayAttempt ? "View Today's Result" : "Play Daily Challenge"}
                className="w-full"
                fillColor="#7B1E2B"
                labelColor="#F7F0E5"
                accentColor="#C49A6C"
                cornerRadius={24}
              />
            </Link>

            <button
              type="button"
              onClick={() => setShowTutorial(true)}
              className="w-full rounded-full border border-[#C49A6C] bg-white/90 px-6 py-3 text-sm font-bold font-sans tracking-tight text-[#32171D] shadow-xs hover:bg-[#faeee0] active:scale-[0.97] transition-all duration-200 ease-out cursor-pointer"
            >
              <span className="font-bold">How to Play</span>
            </button>

            {!isSignedIn && (
              <div className="w-full flex flex-col items-center gap-1.5">
                <SignInButton mode="modal">
                  <div className="w-full">
                    <ShinyButton
                      label="Log In / Create Account"
                      className="w-full"
                      fillColor="#32171D"
                      labelColor="#F7F0E5"
                      accentColor="#C49A6C"
                      cornerRadius={24}
                      onClick={() => {
                        if (
                          typeof window !== "undefined" &&
                          !(window as unknown as { Clerk?: { loaded?: boolean } }).Clerk?.loaded
                        ) {
                          window.location.href = "/sign-in";
                        }
                      }}
                    />
                  </div>
                </SignInButton>
                {todayAttempt && (
                  <p className="text-[11px] text-[#6B4E55] font-medium text-center">
                    Save your {streak > 0 ? `${streak}-day ` : ""}streak &amp; sync across devices
                  </p>
                )}
              </div>
            )}

            {isSignedIn && (
              <Link href="/classic" className="w-full block">
                <ShinyButton
                  label="Play Classic Mode"
                  className="w-full"
                  fillColor="#32171D"
                  labelColor="#F7F0E5"
                  accentColor="#C49A6C"
                  cornerRadius={24}
                />
              </Link>
            )}
          </div>
        </section>
      </main>

      {/* Tutorial / How to Play Modal */}
      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />

      <Footer />
    </div>
  );
}

