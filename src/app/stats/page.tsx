"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useUser, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { loadProgress } from "@/features/game/persistence/local-progress";
import { calculatePlayerStatistics, type PlayerStatistics } from "@/features/game/modes/statistics";
import { getDailyDateString } from "@/features/game/modes/daily-scheduler";
import { syncUserProgress } from "@/features/game/persistence/user-sync";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShinyButton } from "@/components/ui/shiny-button";

export default function StatisticsPage(): React.JSX.Element {
  const { isSignedIn, user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<PlayerStatistics | null>(null);
  const [activeTab, setActiveTab] = useState<"ALL" | "DAILY" | "CLASSIC">("ALL");
  const [syncedWithCloud, setSyncedWithCloud] = useState(false);

  useEffect(() => {
    const todayStr = getDailyDateString();
    const progress = loadProgress();
    const calculated = calculatePlayerStatistics(progress, todayStr);
    setStats(calculated);
    setMounted(true);

    if (isSignedIn && user?.id) {
      syncUserProgress(user.id).then((result) => {
        setStats(result.stats);
        setSyncedWithCloud(result.syncedWithCloud);
      });
    }
  }, [isSignedIn, user?.id]);

  if (!mounted || !stats) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-[#F7F0E5]">
        <Header />
        <main className="mx-auto flex flex-1 items-center justify-center p-6">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7B1E2B] border-t-transparent" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#F7F0E5]">
      <Header />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-4 sm:px-6 sm:py-8">
        {/* Title */}
        <div className="text-center space-y-1.5">
          <span className="inline-block rounded-full border border-[#C49A6C] bg-[#faeee0] px-3.5 py-1 text-xs font-semibold text-[#7B1E2B]">
            Authoritative Solving Records
          </span>

          <h1 className="text-3xl font-extrabold tracking-tight text-[#32171D] sm:text-4xl">
            Player Statistics
          </h1>
          <p className="mx-auto max-w-md text-xs sm:text-sm text-[#6B4E55]">
            Performance metrics derived exclusively from validated Daily and Classic game rounds.
          </p>
        </div>

        {/* If user is signed out, require sign-in to view statistics */}
        {!isSignedIn ? (
          <div className="mt-6 rounded-3xl border border-[#C49A6C]/40 bg-white p-6 sm:p-10 text-center shadow-xs">
            <h2 className="text-2xl font-black text-[#32171D] sm:text-3xl">
              Sign In to View Your Statistics
            </h2>
            <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-[#6B4E55] leading-relaxed">
              You should first sign in to see your statistics. All your game results, daily streaks, win rates, and solving metrics are securely synced and authored by your personal Clerk account.
            </p>

            {/* Clerk Sign In / Sign Up CTAs */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <SignInButton mode="modal">
                <ShinyButton label="Sign In to Account" cornerRadius={24} />
              </SignInButton>

              <SignUpButton mode="modal">
                <button
                  type="button"
                  className="rounded-full border border-[#C49A6C] bg-white px-6 py-3 text-sm font-semibold text-[#32171D] hover:bg-[#faeee0] active:scale-[0.97] transition-all duration-200 ease-out cursor-pointer"
                >
                  Create Free Account
                </button>
              </SignUpButton>
            </div>

            {/* Sync Benefits Highlights */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left border-t border-[#C49A6C]/20 pt-6">
              <div className="rounded-2xl border border-[#C49A6C]/30 bg-[#faeee0]/40 p-3.5">
                <span className="text-xs font-bold text-[#7B1E2B] block">Cloud Streak Sync</span>
                <p className="mt-1 text-[11px] text-[#6B4E55] leading-normal">
                  Your daily streak stays alive whether you play on mobile or desktop.
                </p>
              </div>

              <div className="rounded-2xl border border-[#C49A6C]/30 bg-[#faeee0]/40 p-3.5">
                <span className="text-xs font-bold text-[#7B1E2B] block">Authoritative Records</span>
                <p className="mt-1 text-[11px] text-[#6B4E55] leading-normal">
                  Every solved puzzle and timing record is verified and saved to your account.
                </p>
              </div>

              <div className="rounded-2xl border border-[#C49A6C]/30 bg-[#faeee0]/40 p-3.5">
                <span className="text-xs font-bold text-[#7B1E2B] block">Automatic Local Merge</span>
                <p className="mt-1 text-[11px] text-[#6B4E55] leading-normal">
                  Already played as a guest? Signing in automatically attaches your records.
                </p>
              </div>
            </div>

            {/* Play as Guest Alternatives */}
            <div className="mt-6 border-t border-[#C49A6C]/20 pt-4">
              <p className="text-xs text-[#6B4E55]">
                Want to play first? You can always play anonymously without signing in:
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-3">
                <Link
                  href="/daily"
                  className="rounded-full border border-[#C49A6C] bg-[#faeee0]/80 px-5 py-2 text-xs font-bold text-[#7B1E2B] hover:bg-[#faeee0] active:scale-[0.98] transition"
                >
                  Play Daily Challenge
                </Link>
                <Link
                  href="/classic"
                  className="rounded-full border border-[#C49A6C] bg-white px-5 py-2 text-xs font-semibold text-[#32171D] hover:bg-[#faeee0] active:scale-[0.98] transition"
                >
                  Play Classic Sprint
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Signed-In Statistics Dashboard */
          <div className="mt-4 space-y-4">
            {/* Account Synced Status Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-[#C49A6C]/50 bg-white p-3.5 sm:p-4 shadow-2xs">
              <div className="flex items-center gap-3">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "h-9 w-9 border border-[#C49A6C]",
                    },
                  }}
                />
                <div className="text-left">
                  <p className="text-sm font-extrabold text-[#32171D]">
                    {user?.fullName || user?.primaryEmailAddress?.emailAddress || "Signed-in Player"}
                  </p>
                  <p className="text-xs text-[#8C6D68]">
                    {user?.primaryEmailAddress?.emailAddress || "Verified Player"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 self-stretch sm:self-auto justify-center">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                <span>{syncedWithCloud ? "Synced with Cloud" : "Progress Active"}</span>
              </div>
            </div>

            {/* Responsive Tab Switcher using Tabs component */}
            <div className="flex justify-center w-full">
              <Tabs value={activeTab} className="w-full max-w-md">
                <TabsList variant="button" shape="pill" size="sm" className="grid grid-cols-3 w-full bg-[#faeee0] p-1 border border-[#C49A6C]/40 rounded-full shadow-2xs">
                  <TabsTrigger
                    value="ALL"
                    aria-label="Overview"
                    onClick={() => setActiveTab("ALL")}
                    className={`rounded-full py-1.5 text-xs font-bold transition-all duration-200 ease-out active:scale-[0.96] cursor-pointer ${
                      activeTab === "ALL" ? "bg-[#7B1E2B] text-[#F7F0E5] shadow-xs" : "text-[#6B4E55] hover:text-[#32171D]"
                    }`}
                  >
                    <span className="hidden sm:inline">Overview</span>
                    <span className="sm:hidden" aria-hidden="true">All</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="DAILY"
                    aria-label="Daily Challenge"
                    onClick={() => setActiveTab("DAILY")}
                    className={`rounded-full py-1.5 text-xs font-bold transition-all duration-200 ease-out active:scale-[0.96] cursor-pointer ${
                      activeTab === "DAILY" ? "bg-[#7B1E2B] text-[#F7F0E5] shadow-xs" : "text-[#6B4E55] hover:text-[#32171D]"
                    }`}
                  >
                    <span className="hidden sm:inline">Daily Challenge</span>
                    <span className="sm:hidden" aria-hidden="true">Daily</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="CLASSIC"
                    aria-label="Classic Practice"
                    onClick={() => setActiveTab("CLASSIC")}
                    className={`rounded-full py-1.5 text-xs font-bold transition-all duration-200 ease-out active:scale-[0.96] cursor-pointer ${
                      activeTab === "CLASSIC" ? "bg-[#7B1E2B] text-[#F7F0E5] shadow-xs" : "text-[#6B4E55] hover:text-[#32171D]"
                    }`}
                  >
                    <span className="hidden sm:inline">Classic Practice</span>
                    <span className="sm:hidden" aria-hidden="true">Classic</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Dashboard Content */}
            {stats.totalPlayed === 0 ? (
              <div className="rounded-3xl border border-[#C49A6C]/40 bg-[#FDFBF7] p-8 text-center shadow-xs">
                <h2 className="text-xl font-bold text-[#32171D]">No Games Completed Yet</h2>
                <p className="mx-auto mt-2 max-w-sm text-xs text-[#6B4E55]">
                  Complete your first Daily Challenge or practice in Classic mode to start building your official performance statistics!
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link
                    href="/daily"
                    className="rounded-full bg-[#7B1E2B] px-5 py-2 text-xs font-bold text-[#F7F0E5] shadow-xs hover:bg-[#631722] active:scale-[0.97] transition-all duration-200 ease-out"
                  >
                    Play Daily Challenge
                  </Link>
                  <Link
                    href="/classic"
                    className="rounded-full border border-[#C49A6C] bg-white px-5 py-2 text-xs font-semibold text-[#32171D] hover:bg-[#faeee0] active:scale-[0.97] transition-all duration-200 ease-out"
                  >
                    Play Classic
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Wordle-Style Primary Statistics Block */}
                <div className="rounded-3xl border border-[#C49A6C]/50 bg-white p-5 sm:p-6 shadow-xs text-center">
                  <div className="mb-4 flex items-center justify-center gap-2">
                    <span className="h-px w-8 bg-[#C49A6C]/30" aria-hidden="true" />
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[#8C6870]">
                      Statistics
                    </h2>
                    <span className="h-px w-8 bg-[#C49A6C]/30" aria-hidden="true" />
                  </div>

                  {/* 4-Stat Grid: Single Row Across Mobile & Desktop with vertical dividers */}
                  <div className="grid grid-cols-4 divide-x divide-[#C49A6C]/30 text-center">
                    <div className="px-1 sm:px-2">
                      <p className="text-2xl sm:text-4xl font-black tracking-tight text-[#32171D]">
                        {activeTab === "DAILY"
                          ? stats.daily.totalPlayed
                          : activeTab === "CLASSIC"
                            ? stats.classic.totalPlayed
                            : stats.totalPlayed}
                      </p>
                      <p className="mt-1 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-[#8C6D68]">
                        Games Played
                      </p>
                    </div>

                    <div className="px-1 sm:px-2">
                      <p className="text-2xl sm:text-4xl font-black tracking-tight text-[#7B1E2B]">
                        {activeTab === "DAILY"
                          ? stats.daily.totalWins
                          : activeTab === "CLASSIC"
                            ? stats.classic.totalWins
                            : stats.totalWins}
                      </p>
                      <p className="mt-1 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-[#8C6D68]">
                        Total Solved
                      </p>
                    </div>

                    <div className="px-1 sm:px-2">
                      <p className="text-2xl sm:text-4xl font-black tracking-tight text-[#32171D]">
                        {activeTab === "DAILY"
                          ? stats.daily.winRate
                          : activeTab === "CLASSIC"
                            ? stats.classic.winRate
                            : stats.winRate}
                        %
                      </p>
                      <p className="mt-1 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-[#8C6D68]">
                        Win Rate
                      </p>
                    </div>

                    <div className="px-1 sm:px-2">
                      <p className="text-2xl sm:text-4xl font-black tracking-tight text-[#7B1E2B]">
                        {stats.daily.currentStreak}
                      </p>
                      <p className="mt-1 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-[#8C6D68]">
                        Streak
                      </p>
                    </div>
                  </div>
                </div>

                {/* Secondary Metrics Card: Speed & Performance Grid */}
                <div className="rounded-2xl border border-[#C49A6C]/40 bg-white p-4 sm:p-5 shadow-xs">
                  <div className="mb-3 flex items-center justify-between border-b border-[#C49A6C]/20 pb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8C6870]">
                      Speed &amp; Scoring
                    </span>
                    <span className="rounded-full bg-[#faeee0] px-2.5 py-0.5 text-[10px] font-bold text-[#7B1E2B] border border-[#C49A6C]/30">
                      Performance
                    </span>
                  </div>

                  <div className="grid grid-cols-3 divide-x divide-[#C49A6C]/25 text-center">
                    <div className="px-2">
                      <span className="text-[10px] sm:text-xs font-bold text-[#8C6D68] uppercase block">
                        Best Solve Time
                      </span>
                      <p className="mt-1 text-xl sm:text-2xl font-black text-[#32171D]">
                        {stats.bestSolveTimeSeconds !== null ? `${stats.bestSolveTimeSeconds}s` : "—"}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[#8C6870] hidden sm:block">Fastest completion</p>
                    </div>

                    <div className="px-2">
                      <span className="text-[10px] sm:text-xs font-bold text-[#8C6D68] uppercase block">
                        Average Solve Time
                      </span>
                      <p className="mt-1 text-xl sm:text-2xl font-black text-[#32171D]">
                        {stats.averageSolveTimeSeconds !== null
                          ? `${stats.averageSolveTimeSeconds}s`
                          : "—"}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[#8C6870] hidden sm:block">Across all solves</p>
                    </div>

                    <div className="px-2">
                      <span className="text-[10px] sm:text-xs font-bold text-[#8C6D68] uppercase block">
                        Total Points
                      </span>
                      <p className="mt-1 text-xl sm:text-2xl font-black text-[#7B1E2B]">
                        {stats.totalPoints}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[#8C6870] hidden sm:block">Cumulative score</p>
                    </div>
                  </div>
                </div>

                {/* Daily Streak Highlight Card */}
                <div className="rounded-2xl border border-[#C49A6C]/40 bg-white p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-[#32171D] text-sm sm:text-base">Daily Streak Tracking</h3>
                    <p className="text-xs text-[#6B4E55] mt-0.5">
                      Consecutive calendar days with an official Daily win (Asia/Kolkata timezone).
                    </p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="rounded-xl border border-[#C49A6C]/40 bg-[#faeee0] px-4 py-2 text-center flex-1 sm:flex-initial">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6870] block">Active</span>
                      <p className="text-lg sm:text-xl font-black text-[#7B1E2B]">
                        {stats.daily.currentStreak} {stats.daily.currentStreak === 1 ? "day" : "days"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#C49A6C]/30 bg-white px-4 py-2 text-center flex-1 sm:flex-initial">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6870] block">All-Time Best</span>
                      <p className="text-lg sm:text-xl font-black text-[#32171D]">
                        {stats.daily.longestStreak} {stats.daily.longestStreak === 1 ? "day" : "days"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Navigation to Modes */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-[#C49A6C]/40 bg-white p-3.5 sm:p-4 shadow-2xs">
                  <span className="text-xs font-semibold text-[#6B4E55]">
                    All metrics are synced with your personal Clerk account.
                  </span>

                  <div className="flex items-center gap-2">
                    <Link
                      href="/daily"
                      className="rounded-full bg-[#7B1E2B] px-5 py-2 text-xs font-bold text-[#F7F0E5] shadow-xs hover:bg-[#631722] active:scale-[0.97] transition-all duration-200 ease-out"
                    >
                      Play Daily
                    </Link>
                    <Link
                      href="/classic"
                      className="rounded-full border border-[#C49A6C] bg-[#faeee0] px-5 py-2 text-xs font-bold text-[#32171D] hover:bg-[#f4ddc5] active:scale-[0.97] transition-all duration-200 ease-out"
                    >
                      Play Classic
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
