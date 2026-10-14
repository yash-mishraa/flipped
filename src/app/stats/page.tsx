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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-[#C49A6C]/30 bg-[#faeee0]/70 px-4 py-3">
              <div className="flex items-center gap-3">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8 border border-[#C49A6C]",
                    },
                  }}
                />
                <div className="text-left">
                  <p className="text-xs font-bold text-[#32171D]">
                    {user?.fullName || user?.primaryEmailAddress?.emailAddress || "Signed-in Player"}
                  </p>
                  <p className="text-[11px] text-[#6B4E55]">
                    Account Author: <span className="font-mono text-[10px] text-[#7B1E2B]">{user?.id}</span>
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                {syncedWithCloud ? "Synced with Account" : "Progress Active"}
              </span>
            </div>

            {/* Tab Switcher using Tabs component */}
            <div className="flex justify-center">
              <Tabs value={activeTab} className="w-auto">
                <TabsList variant="button" shape="pill" size="sm" className="bg-[#faeee0]/80 p-0.5 border border-[#C49A6C]/30">
                  <TabsTrigger
                    value="ALL"
                    onClick={() => setActiveTab("ALL")}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ease-out active:scale-[0.96] ${
                      activeTab === "ALL" ? "bg-[#7B1E2B] text-[#F7F0E5] shadow-xs" : "text-[#6B4E55] hover:text-[#32171D] hover:bg-black/5"
                    }`}
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="DAILY"
                    onClick={() => setActiveTab("DAILY")}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ease-out active:scale-[0.96] ${
                      activeTab === "DAILY" ? "bg-[#7B1E2B] text-[#F7F0E5] shadow-xs" : "text-[#6B4E55] hover:text-[#32171D] hover:bg-black/5"
                    }`}
                  >
                    Daily Challenge
                  </TabsTrigger>
                  <TabsTrigger
                    value="CLASSIC"
                    onClick={() => setActiveTab("CLASSIC")}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ease-out active:scale-[0.96] ${
                      activeTab === "CLASSIC" ? "bg-[#7B1E2B] text-[#F7F0E5] shadow-xs" : "text-[#6B4E55] hover:text-[#32171D] hover:bg-black/5"
                    }`}
                  >
                    Classic Practice
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
                    className="rounded-full bg-[#7B1E2B] px-5 py-2 text-xs font-bold text-[#F7F0E5] shadow-xs hover:opacity-90 active:scale-[0.98] transition"
                  >
                    Play Daily Challenge
                  </Link>
                  <Link
                    href="/classic"
                    className="rounded-full border border-[#C49A6C] bg-white px-5 py-2 text-xs font-semibold text-[#32171D] hover:bg-[#faeee0] active:scale-[0.98] transition"
                  >
                    Play Classic
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Primary KPI Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-2xl border border-[#C49A6C]/40 bg-white p-4 text-center shadow-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6D68]">
                      Games Played
                    </span>
                    <p className="mt-1 text-2xl sm:text-3xl font-black text-[#32171D]">
                      {activeTab === "DAILY"
                        ? stats.daily.totalPlayed
                        : activeTab === "CLASSIC"
                          ? stats.classic.totalPlayed
                          : stats.totalPlayed}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#C49A6C]/40 bg-white p-4 text-center shadow-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6D68]">
                      Total Solved
                    </span>
                    <p className="mt-1 text-2xl sm:text-3xl font-black text-[#7B1E2B]">
                      {activeTab === "DAILY"
                        ? stats.daily.totalWins
                        : activeTab === "CLASSIC"
                          ? stats.classic.totalWins
                          : stats.totalWins}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#C49A6C]/40 bg-white p-4 text-center shadow-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6D68]">
                      Win Rate
                    </span>
                    <p className="mt-1 text-2xl sm:text-3xl font-black text-[#32171D]">
                      {activeTab === "DAILY"
                        ? stats.daily.winRate
                        : activeTab === "CLASSIC"
                          ? stats.classic.winRate
                          : stats.winRate}
                      %
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#C49A6C]/40 bg-white p-4 text-center shadow-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6D68]">
                      Streak
                    </span>
                    <p className="mt-1 text-2xl sm:text-3xl font-black text-[#7B1E2B]">{stats.daily.currentStreak}</p>
                  </div>
                </div>

                {/* Secondary KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-[#C49A6C]/40 bg-white p-4 shadow-xs">
                    <span className="text-xs font-bold text-[#8C6D68] block">Best Solve Time</span>
                    <p className="mt-2 text-2xl font-black text-[#32171D]">
                      {stats.bestSolveTimeSeconds !== null ? `${stats.bestSolveTimeSeconds}s` : "—"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#6B4E55]">Fastest completion recorded</p>
                  </div>

                  <div className="rounded-2xl border border-[#C49A6C]/40 bg-white p-4 shadow-xs">
                    <span className="text-xs font-bold text-[#8C6D68] block">Average Solve Time</span>
                    <p className="mt-2 text-2xl font-black text-[#32171D]">
                      {stats.averageSolveTimeSeconds !== null
                        ? `${stats.averageSolveTimeSeconds}s`
                        : "—"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#6B4E55]">Across all solved challenges</p>
                  </div>

                  <div className="rounded-2xl border border-[#C49A6C]/40 bg-white p-4 shadow-xs">
                    <span className="text-xs font-bold text-[#8C6D68] block">Total Points</span>
                    <p className="mt-2 text-2xl font-black text-[#7B1E2B]">{stats.totalPoints}</p>
                    <p className="mt-0.5 text-[11px] text-[#6B4E55]">Cumulative authoritative score</p>
                  </div>
                </div>

                {/* Daily Streak Highlight Card */}
                <div className="rounded-2xl border border-[#C49A6C]/40 bg-white p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-[#32171D] text-base">Daily Streak Tracking</h3>
                    <p className="text-xs text-[#6B4E55] mt-0.5">
                      Consecutive calendar days with an official Daily win (Asia/Kolkata timezone).
                    </p>
                  </div>

                  <div className="flex items-center gap-6 border-t sm:border-t-0 sm:border-l border-[#C49A6C]/20 pt-3 sm:pt-0 sm:pl-6 w-full sm:w-auto justify-between sm:justify-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#8C6D68]">Active</span>
                      <p className="text-xl font-black text-[#7B1E2B]">
                        {stats.daily.currentStreak} {stats.daily.currentStreak === 1 ? "day" : "days"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#8C6D68]">All-Time Best</span>
                      <p className="text-xl font-black text-[#32171D]">
                        {stats.daily.longestStreak} {stats.daily.longestStreak === 1 ? "day" : "days"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Navigation to Modes */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-[#C49A6C]/40 bg-white/70 p-4">
                  <span className="text-xs font-semibold text-[#32171D]">
                    All metrics are synced with your personal Clerk account.
                  </span>

                  <div className="flex items-center gap-2">
                    <Link
                      href="/daily"
                      className="rounded-full bg-[#7B1E2B] px-4 py-2 text-xs font-bold text-[#F7F0E5] hover:opacity-90 active:scale-[0.98] transition"
                    >
                      Play Daily
                    </Link>
                    <Link
                      href="/classic"
                      className="rounded-full border border-[#C49A6C] bg-white px-4 py-2 text-xs font-semibold text-[#32171D] hover:bg-[#faeee0] active:scale-[0.98] transition"
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
