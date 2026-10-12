"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Terminal, Layers } from "lucide-react";
import { GameBoard } from "@/features/game/components/GameBoard";
import { TEST_PUZZLES } from "@/features/game";

export default function PlayPage(): React.JSX.Element {
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const currentPuzzle = TEST_PUZZLES[puzzleIndex] || TEST_PUZZLES[0]!;

  const handleNextFixture = () => {
    setPuzzleIndex((prev) => (prev + 1) % TEST_PUZZLES.length);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-between px-4 py-8 sm:px-8 sm:py-12">
      {/* Top Header & Navigation */}
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
            <Terminal className="h-3.5 w-3.5 text-coral-600" aria-hidden="true" />
            <span>Stage 4 • 60-Second Timed Round</span>
          </div>

          <button
            type="button"
            onClick={handleNextFixture}
            title="Cycle to next test puzzle fixture"
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 active:scale-95"
          >
            <Layers className="h-3.5 w-3.5 text-coral-500" aria-hidden="true" />
            <span className="hidden sm:inline">
              Next Puzzle ({puzzleIndex + 1}/{TEST_PUZZLES.length})
            </span>
            <span className="sm:hidden">
              {puzzleIndex + 1}/{TEST_PUZZLES.length}
            </span>
          </button>
        </div>

        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
            Flipped
          </h1>
          <p className="mt-1 text-xs text-stone-500 sm:text-sm">
            Development Puzzle Fixture:{" "}
            <strong className="text-stone-800">{currentPuzzle.id}</strong> (Difficulty:{" "}
            {currentPuzzle.difficulty})
          </p>
        </div>
      </header>

      {/* Main Interactive Game Board */}
      <section className="my-8 w-full flex-1 flex flex-col justify-center">
        {/* Key forces remount when switching test puzzle fixtures */}
        <GameBoard key={currentPuzzle.id} puzzle={currentPuzzle} />
      </section>

      {/* Footer Notice */}
      <footer className="border-t border-stone-200/80 pt-4 text-center text-xs text-stone-500">
        <p>
          Stage 4 Timed Development Experience • 60-second countdown with auto-detection, hints, and
          result summaries. Full Daily mode and LocalStorage persistence will be implemented in
          subsequent stages.
        </p>
      </footer>
    </main>
  );
}
