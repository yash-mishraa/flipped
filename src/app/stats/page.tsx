"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Trophy,
  Flame,
  Clock,
  Sparkles,
  BarChart2,
  Calendar,
  Compass,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { loadProgress } from "@/features/game/persistence/local-progress";
import { calculatePlayerStatistics, type PlayerStatistics } from "@/features/game/modes/statistics";
import { getDailyDateString } from "@/features/game/modes/daily-scheduler";

export default function StatisticsPage(): React.JSX.Element {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<PlayerStatistics | null>(null);
  const [activeTab, setActiveTab] = useState<"ALL" | "DAILY" | "CLASSIC">("ALL");

  useEffect(() => {
    const progress = loadProgress();
    const todayStr = getDailyDateString();
    const calculated = calculatePlayerStatistics(progress, todayStr);
    setStats(calculated);
    setMounted(true);
  }, []);

  if (!mounted || !stats) {
    return (
      <div className="flex min-h-screen flex-col bg-[#fcfbf9]">
        <Header />
        <main className="mx-auto flex flex-1 items-center justify-center p-6">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-coral-500 border-t-transparent" />
        </main>
        <Footer />
      </div>
    );
  }

  const hasPlayedAny = stats.totalPlayed > 0;

  return (
    <div className="flex min-h-screen flex-col bg-[#fcfbf9]">
      <Header />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-coral-200 bg-coral-50 px-3 py-1 text-xs font-semibold text-coral-700">
            <BarChart2 className="h-3.5 w-3.5 text-coral-600" aria-hidden="true" />
            <span>Authoritative Solving Records</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
            Player Statistics
          </h1>
          <p className="mx-auto max-w-md text-xs sm:text-sm text-stone-500">
            Performance metrics derived exclusively from validated Daily and Classic game rounds.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="mt-8 flex justify-center">
          <div
            role="tablist"
            aria-label="Statistics Category"
            className="inline-flex rounded-xl border border-stone-200 bg-stone-100/70 p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "ALL"}
              onClick={() => setActiveTab("ALL")}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
                activeTab === "ALL"
                  ? "bg-white text-stone-900 shadow-2xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "DAILY"}
              onClick={() => setActiveTab("DAILY")}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
                activeTab === "DAILY"
                  ? "bg-white text-stone-900 shadow-2xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Daily Challenge
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "CLASSIC"}
              onClick={() => setActiveTab("CLASSIC")}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
                activeTab === "CLASSIC"
                  ? "bg-white text-stone-900 shadow-2xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Classic Practice
            </button>
          </div>
        </div>

        {/* Content */}
        {!hasPlayedAny ? (
          <div className="mt-10 rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-xs">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-500">
              <Trophy className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-stone-900">No Games Completed Yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-xs text-stone-500">
              Complete your first Daily Challenge or practice in Classic mode to start building your
              official performance statistics!
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/daily"
                className="inline-flex items-center gap-2 rounded-xl bg-coral-500 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-coral-600 transition"
              >
                <Calendar className="h-4 w-4" />
                <span>Play Daily Challenge</span>
              </Link>
              <Link
                href="/classic"
                className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
              >
                <Compass className="h-4 w-4" />
                <span>Play Classic</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {/* Primary KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="rounded-2xl border border-stone-200/90 bg-white p-4 text-center shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                  Games Played
                </span>
                <p className="mt-1 text-3xl font-black text-stone-900">
                  {activeTab === "DAILY"
                    ? stats.daily.totalPlayed
                    : activeTab === "CLASSIC"
                      ? stats.classic.totalPlayed
                      : stats.totalPlayed}
                </p>
              </div>

              <div className="rounded-2xl border border-stone-200/90 bg-white p-4 text-center shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                  Total Solved
                </span>
                <p className="mt-1 text-3xl font-black text-emerald-700">
                  {activeTab === "DAILY"
                    ? stats.daily.totalWins
                    : activeTab === "CLASSIC"
                      ? stats.classic.totalWins
                      : stats.totalWins}
                </p>
              </div>

              <div className="rounded-2xl border border-stone-200/90 bg-white p-4 text-center shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                  Win Rate
                </span>
                <p className="mt-1 text-3xl font-black text-stone-900">
                  {activeTab === "DAILY"
                    ? stats.daily.winRate
                    : activeTab === "CLASSIC"
                      ? stats.classic.winRate
                      : stats.winRate}
                  %
                </p>
              </div>

              <div className="rounded-2xl border border-stone-200/90 bg-white p-4 text-center shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                  Current Streak
                </span>
                <div className="mt-1 flex items-center justify-center gap-1.5">
                  <Flame
                    className={`h-5 w-5 ${
                      stats.daily.currentStreak > 0 ? "text-coral-500" : "text-stone-300"
                    }`}
                  />
                  <p className="text-3xl font-black text-coral-600">{stats.daily.currentStreak}</p>
                </div>
              </div>
            </div>

            {/* Secondary Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
                <div className="flex items-center gap-2 text-stone-400 text-xs font-semibold uppercase">
                  <Clock className="h-4 w-4 text-stone-400" />
                  <span>Fastest Solve</span>
                </div>
                <p className="mt-2 text-2xl font-black text-stone-900">
                  {stats.bestSolveTimeSeconds !== null ? `${stats.bestSolveTimeSeconds}s` : "—"}
                </p>
                <span className="text-[11px] text-stone-400">Best 60s round win</span>
              </div>

              <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
                <div className="flex items-center gap-2 text-stone-400 text-xs font-semibold uppercase">
                  <Clock className="h-4 w-4 text-stone-400" />
                  <span>Average Solve</span>
                </div>
                <p className="mt-2 text-2xl font-black text-stone-900">
                  {stats.averageSolveTimeSeconds !== null
                    ? `${stats.averageSolveTimeSeconds}s`
                    : "—"}
                </p>
                <span className="text-[11px] text-stone-400">Across completed wins</span>
              </div>

              <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
                <div className="flex items-center gap-2 text-stone-400 text-xs font-semibold uppercase">
                  <Sparkles className="h-4 w-4 text-coral-500" />
                  <span>Points Earned</span>
                </div>
                <p className="mt-2 text-2xl font-black text-coral-600">{stats.totalPoints}</p>
                <span className="text-[11px] text-stone-400">Official Daily score sum</span>
              </div>
            </div>

            {/* Daily Streak Highlight Card */}
            <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-coral-50 text-coral-600">
                  <Flame className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Daily Streak Tracking</h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Consecutive calendar days with an official Daily win (Asia/Kolkata timezone).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 border-t sm:border-t-0 sm:border-l border-stone-100 pt-3 sm:pt-0 sm:pl-6 w-full sm:w-auto justify-between sm:justify-start">
                <div>
                  <span className="text-[10px] font-bold uppercase text-stone-400">Active</span>
                  <p className="text-xl font-black text-coral-600">
                    {stats.daily.currentStreak} {stats.daily.currentStreak === 1 ? "day" : "days"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-stone-400">
                    All-Time Best
                  </span>
                  <p className="text-xl font-black text-stone-900">
                    {stats.daily.longestStreak} {stats.daily.longestStreak === 1 ? "day" : "days"}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Navigation to Modes */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white/70 p-4">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <span className="text-xs font-semibold text-stone-700">
                  All metrics are computed deterministically without client modification.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/daily"
                  className="inline-flex items-center gap-1 rounded-xl bg-coral-500 px-4 py-2 text-xs font-bold text-white hover:bg-coral-600 transition"
                >
                  <span>Play Daily</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/classic"
                  className="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
                >
                  <span>Play Classic</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
