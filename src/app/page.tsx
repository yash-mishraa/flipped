"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { Header } from "@/components/Header";
import { AcidSquares } from "@/components/AcidSquares";
import DecryptedText from "@/components/DecryptedText";
import { Footer } from "@/components/Footer";
import { FlippedSymbol } from "@/components/FlippedLogo";
import { SplashIntro } from "@/components/SplashIntro";
import { TutorialModal } from "@/features/game/components/TutorialModal";
import { ShinyButton } from "@/components/ui/shiny-button";
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
              className="w-full rounded-full border border-[#C49A6C] bg-white/90 px-6 py-3 text-sm font-semibold text-[#32171D] shadow-xs hover:bg-[#faeee0] active:scale-[0.98] transition cursor-pointer"
            >
              How to Play
            </button>

            <Show when="signed-out">
              <SignInButton mode="modal">
                <div className="w-full">
                  <ShinyButton
                    label="Log In / Create Account"
                    className="w-full"
                    fillColor="#32171D"
                    labelColor="#F7F0E5"
                    accentColor="#C49A6C"
                    cornerRadius={24}
                  />
                </div>
              </SignInButton>
            </Show>

            <Show when="signed-in">
              <div className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#C49A6C]/40 bg-white/90 px-4 py-2 text-xs font-semibold text-[#32171D] shadow-xs">
                <UserButton />
                <span>Account Connected</span>
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
