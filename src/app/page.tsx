"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  BookOpen,
  UserPlus,
} from "lucide-react";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { Header } from "@/components/Header";
import { AcidSquares } from "@/components/AcidSquares";
import DecryptedText from "@/components/DecryptedText";
import { Footer } from "@/components/Footer";
import { FlippedSymbol } from "@/components/FlippedLogo";
import { SplashIntro } from "@/components/SplashIntro";
import { TutorialModal } from "@/features/game/components/TutorialModal";
import { loadProgress } from "@/features/game/persistence/local-progress";
import { getDailyDateString } from "@/features/game/modes/daily-scheduler";
import type { DailyAttemptRecord } from "@/features/game/modes/mode-types";

export default function HomePage(): React.JSX.Element {
  const [todayAttempt, setTodayAttempt] = useState<DailyAttemptRecord | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const today = getDailyDateString();
    const progress = loadProgress();
    const attempt = progress.daily[today] ?? null;
    setTodayAttempt(attempt);
  }, []);

  return (
    <div className="home-page flex min-h-screen flex-col">
      <SplashIntro />
      <AcidSquares className="home-acid-background" color="#F7F0E5" accentColor="#C49A6C" />
      <Header />

      <main className="mx-auto flex flex-1 w-full max-w-4xl flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-16">
        {/* Streamlined Hero Section */}
        <section
          className="w-full text-center space-y-4 my-auto max-w-lg mx-auto"
          aria-label="Game Introduction"
        >
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

          <p className="mx-auto max-w-md text-base sm:text-lg text-[#6B4E55] leading-relaxed">
            Flip the meanings of two clue words to uncover a familiar phrase. Fill the letter grid
            before your 60-second timer runs out.
          </p>

          {/* Action Buttons: Play Daily Challenge, How to Play, Log In / Create Account */}
          <div className="mx-auto flex w-full max-w-xs flex-col gap-3 pt-4">
            <Link
              href="/daily"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7B1E2B] px-6 py-3.5 text-sm font-bold text-[#F7F0E5] shadow-md hover:bg-[#631722] transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B1E2B]"
            >
              <Calendar className="h-4 w-4" aria-hidden="true" />
              <span>{todayAttempt ? "View Today's Result" : "Play Daily Challenge"}</span>
            </Link>

            <button
              type="button"
              onClick={() => setShowTutorial(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#7B1E2B] bg-white px-6 py-3.5 text-sm font-bold text-[#7B1E2B] shadow-xs hover:bg-[#faeee0] transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B1E2B] cursor-pointer"
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              <span>How to Play</span>
            </button>

            <Show when="signed-out">
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7B1E2B] px-6 py-3.5 text-sm font-bold text-[#F7F0E5] shadow-md hover:bg-[#631722] transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B1E2B] cursor-pointer"
                >
                  <UserPlus className="h-4 w-4" aria-hidden="true" />
                  <span>Log In / Create Account</span>
                </button>
              </SignInButton>
            </Show>

            <Show when="signed-in">
              <div className="inline-flex w-full items-center justify-center gap-2.5 rounded-2xl border border-[#C49A6C]/50 bg-white/90 px-6 py-3 text-xs font-semibold text-[#32171D] shadow-xs">
                <UserButton />
                <span>Account Connected &bull; Progress Synced</span>
              </div>
            </Show>
          </div>
        </section>
      </main>

      {/* Tutorial / How to Play Modal */}
      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />

      <Footer />
    </div>
  );
}
