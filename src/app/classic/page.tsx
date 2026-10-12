"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Compass, RotateCcw, Trophy } from "lucide-react";
import type { Difficulty, Puzzle } from "@/features/game/domain/types";
import { GameBoard } from "@/features/game/components/GameBoard";
import { DifficultySelector } from "@/features/game/components/DifficultySelector";
import { selectClassicPuzzle } from "@/features/game/modes/classic-selector";
import {
  getClassicLastDifficulty,
  getClassicRecentPuzzleIds,
  loadProgress,
} from "@/features/game/persistence/local-progress";

export default function ClassicPage(): React.JSX.Element {
  const [mounted, setMounted] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [puzzleKey, setPuzzleKey] = useState<number>(0);
  const [stats, setStats] = useState({ totalPlayed: 0, totalWins: 0 });

  const refreshStats = useCallback(() => {
    const progress = loadProgress();
    setStats({
      totalPlayed: progress.classic.totalPlayed,
      totalWins: progress.classic.totalWins,
    });
  }, []);

  const loadNextPuzzle = useCallback(
    (selectedDifficulty: Difficulty) => {
      const recentIds = getClassicRecentPuzzleIds();
      const result = selectClassicPuzzle(selectedDifficulty, { recentPuzzleIds: recentIds });

      if (result.status === "SUCCESS") {
        setCurrentPuzzle(result.puzzle);
        setPuzzleKey((prev) => prev + 1);
      }
      refreshStats();
    },
    [refreshStats]
  );

  useEffect(() => {
    const initialDifficulty = getClassicLastDifficulty();
    setDifficulty(initialDifficulty);
    loadNextPuzzle(initialDifficulty);
    setMounted(true);
  }, [loadNextPuzzle]);

  const handleDifficultyChange = (newDifficulty: Difficulty) => {
    if (newDifficulty === difficulty) return;
    setDifficulty(newDifficulty);
    loadNextPuzzle(newDifficulty);
  };

  const handleNextPuzzle = () => {
    loadNextPuzzle(difficulty);
  };

  if (!mounted || !currentPuzzle) {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-coral-500 border-t-transparent" />
        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-stone-400">
          Loading Classic Mode...
        </p>
      </main>
    );
  }

  const winRate =
    stats.totalPlayed > 0 ? Math.round((stats.totalWins / stats.totalPlayed) * 100) : 0;

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-between px-4 py-8 sm:px-8 sm:py-12">
      {/* Navigation and Top Bar */}
      <header className="flex flex-col items-center gap-4 text-center">
        <div className="flex w-full items-center justify-between border-b border-stone-200/80 pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 active:scale-95"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Home</span>
          </Link>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-coral-200 bg-coral-50 px-3 py-1 text-xs font-semibold text-coral-700">
            <Compass className="h-3.5 w-3.5 text-coral-600" aria-hidden="true" />
            <span>Classic Mode • Unlimited Replay</span>
          </div>

          <button
            type="button"
            onClick={handleNextPuzzle}
            title="Load another puzzle in this tier"
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 active:scale-95"
          >
            <RotateCcw className="h-3.5 w-3.5 text-coral-500" aria-hidden="true" />
            <span>Skip / Next</span>
          </button>
        </div>

        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
            Classic Practice
          </h1>
          <p className="mt-1 text-xs text-stone-500 sm:text-sm">
            Select your challenge tier and play unlimited repetition-free rounds.
          </p>
        </div>

        {/* Stats Summary Bar */}
        <div className="flex items-center gap-4 rounded-full border border-stone-200/80 bg-white/80 px-4 py-1.5 text-xs text-stone-600 shadow-xs">
          <div className="flex items-center gap-1">
            <Trophy className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
            <span className="font-semibold text-stone-900">{stats.totalWins}</span> Wins
          </div>
          <span className="text-stone-300">•</span>
          <div>
            <span className="font-semibold text-stone-900">{stats.totalPlayed}</span> Played
          </div>
          <span className="text-stone-300">•</span>
          <div>
            <span className="font-semibold text-stone-900">{winRate}%</span> Win Rate
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="w-full pt-2">
          <DifficultySelector
            selectedDifficulty={difficulty}
            onSelectDifficulty={handleDifficultyChange}
          />
        </div>
      </header>

      {/* Main Interactive Game Board */}
      <section className="my-8 w-full flex-1 flex flex-col justify-center">
        <GameBoard
          key={`${currentPuzzle.id}-${puzzleKey}`}
          puzzle={currentPuzzle}
          mode="CLASSIC"
          onNextPuzzle={handleNextPuzzle}
          nextPuzzleLabel="Next Classic Puzzle"
          onPuzzleComplete={refreshStats}
        />
      </section>

      {/* Footer Notice */}
      <footer className="border-t border-stone-200/80 pt-4 text-center text-xs text-stone-500">
        <p>
          Classic Mode • Repetition-minimized puzzle selection across Easy, Medium, and Hard tiers
        </p>
      </footer>
    </main>
  );
}
