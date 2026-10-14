"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Compass, RotateCcw, Trophy } from "lucide-react";
import type { Difficulty } from "@/features/game/domain/types";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DifficultySelector } from "@/features/game/components/DifficultySelector";
import { ServerGameBoard } from "@/features/game/components/ServerGameBoard";
import { getPuzzleCountsByDifficulty } from "@/features/game/data/public-puzzles";
import type {
  SafeGameplayPayload,
  FinalizedResultPayload,
} from "@/server/puzzles/puzzle-repository";
import {
  getClassicLastDifficulty,
  getClassicRecentPuzzleIds,
  recordClassicGame,
  loadProgress,
} from "@/features/game/persistence/local-progress";

export default function ClassicPage(): React.JSX.Element {
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [payload, setPayload] = useState<SafeGameplayPayload | null>(null);
  const [stats, setStats] = useState({ totalPlayed: 0, totalWins: 0 });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const recentIdsRef = useRef<string[]>([]);

  const refreshStats = useCallback(() => {
    const progress = loadProgress();
    setStats({
      totalPlayed: progress.classic.totalPlayed,
      totalWins: progress.classic.totalWins,
    });
    recentIdsRef.current = [...progress.classic.recentlyPlayedIds];
  }, []);

  const loadNextPuzzle = useCallback(
    async (selectedDifficulty: Difficulty) => {
      setLoading(true);
      setErrorMsg(null);

      try {
        const res = await fetch("/api/game/classic/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            difficulty: selectedDifficulty,
            recentPuzzleIds: recentIdsRef.current,
          }),
        });

        const data = await res.json();

        if (data.status === "STARTED") {
          setPayload(data.payload);
        } else if (data.status === "EMPTY_POOL") {
          setErrorMsg(data.message || "No puzzles available for this difficulty.");
        } else {
          setErrorMsg(data.error || "Failed to start Classic round.");
        }
      } catch {
        setErrorMsg("Network error connecting to game server.");
      } finally {
        setLoading(false);
        refreshStats();
      }
    },
    [refreshStats]
  );

  useEffect(() => {
    const initialDifficulty = getClassicLastDifficulty();
    recentIdsRef.current = [...getClassicRecentPuzzleIds()];
    setDifficulty(initialDifficulty);
    loadNextPuzzle(initialDifficulty);
  }, [loadNextPuzzle]);

  const handleDifficultyChange = (newDifficulty: Difficulty) => {
    if (newDifficulty === difficulty) return;
    setDifficulty(newDifficulty);
    loadNextPuzzle(newDifficulty);
  };

  const handleNextPuzzle = () => {
    loadNextPuzzle(difficulty);
  };

  const handleFinalized = (result: FinalizedResultPayload) => {
    recordClassicGame(result.puzzleId, difficulty, result.isWon);
    refreshStats();
  };

  const winRate =
    stats.totalPlayed > 0 ? Math.round((stats.totalWins / stats.totalPlayed) * 100) : 0;

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F0E5]">
      <Header />
      <main className="mx-auto flex flex-1 w-full max-w-4xl flex-col justify-between px-4 py-8 sm:px-8 sm:py-12">
        {/* Navigation and Top Bar */}
        <header className="flex flex-col items-center gap-4 text-center">
          <div className="flex w-full items-center justify-between border-b border-[#C49A6C]/40 pb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#C49A6C]/50 bg-[#faeee0]/70 px-3 py-1.5 text-xs font-semibold text-[#32171D] shadow-sm transition hover:bg-[#faeee0] active:scale-95"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Home</span>
            </Link>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#C49A6C] bg-[#faeee0] px-3 py-1 text-xs font-semibold text-[#7B1E2B]">
              <Compass className="h-3.5 w-3.5 text-[#7B1E2B]" aria-hidden="true" />
              <span>Classic Mode • Server Authoritative</span>
            </div>

            <button
              type="button"
              onClick={handleNextPuzzle}
              title="Load another puzzle in this tier"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#C49A6C]/50 bg-[#faeee0]/70 px-3 py-1.5 text-xs font-semibold text-[#32171D] shadow-sm transition hover:bg-[#faeee0] active:scale-95"
            >
              <RotateCcw className="h-3.5 w-3.5 text-[#7B1E2B]" aria-hidden="true" />
              <span>Skip / Next</span>
            </button>
          </div>

          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#32171D] sm:text-4xl">
              Classic Practice
            </h1>
            <p className="mt-1 text-xs text-[#6B4E55] sm:text-sm">
              Select your challenge tier and play unlimited repetition-free rounds.
            </p>
          </div>

          {/* Stats Summary Bar */}
          <div className="flex items-center gap-4 rounded-full border border-[#C49A6C]/40 bg-[#faeee0]/70 px-4 py-1.5 text-xs text-[#6B4E55] shadow-xs">
            <div className="flex items-center gap-1">
              <Trophy className="h-3.5 w-3.5 text-[#C49A6C]" aria-hidden="true" />
              <span className="font-semibold text-[#32171D]">{stats.totalWins}</span> Wins
            </div>
            <span className="text-[#C49A6C]">•</span>
            <div>
              <span className="font-semibold text-[#32171D]">{stats.totalPlayed}</span> Played
            </div>
            <span className="text-[#C49A6C]">•</span>
            <div>
              <span className="font-semibold text-[#32171D]">{winRate}%</span> Win Rate
            </div>
          </div>

          {/* Difficulty Selection */}
          <div className="w-full pt-2">
            <DifficultySelector
              selectedDifficulty={difficulty}
              onSelectDifficulty={handleDifficultyChange}
              puzzleCounts={getPuzzleCountsByDifficulty()}
            />
          </div>
        </header>

        {/* Main Interactive Game Board */}
        <section className="my-8 w-full flex-1 flex flex-col justify-center">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7B1E2B] border-t-transparent" />
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6B4E55]">
                Loading Classic Puzzle...
              </p>
            </div>
          ) : errorMsg ? (
            <div className="rounded-2xl border border-[#C49A6C]/40 bg-[#FDFBF7] p-6 text-center shadow-xs">
              <p className="text-sm font-semibold text-[#7B1E2B]">{errorMsg}</p>
              <button
                type="button"
                onClick={handleNextPuzzle}
                className="mt-4 rounded-xl bg-[#7B1E2B] px-4 py-2 text-xs font-bold text-[#F7F0E5] hover:opacity-90 transition"
              >
                Try Next Puzzle
              </button>
            </div>
          ) : payload ? (
            <ServerGameBoard
              key={payload.attemptId}
              payload={payload}
              mode="CLASSIC"
              onFinalized={handleFinalized}
              onNextClassic={handleNextPuzzle}
            />
          ) : null}
        </section>

        {/* Footer Notice */}
        <footer className="border-t border-[#C49A6C]/40 pt-4 text-center text-xs text-[#6B4E55]">
          <p>Classic Mode • Server-verified rounds across Easy, Medium, and Hard tiers</p>
        </footer>
      </main>
      <Footer />
    </div>
  );
}
