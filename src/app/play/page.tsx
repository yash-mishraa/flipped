"use client";

import React, { useState } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GameBoard } from "@/features/game/components/GameBoard";
import { TEST_PUZZLES } from "@/features/game/data/test-puzzles";

export default function PlayPage(): React.JSX.Element {
  if (process.env.NODE_ENV === "production") {
    redirect("/classic");
  }

  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const currentPuzzle = TEST_PUZZLES[puzzleIndex] || TEST_PUZZLES[0]!;

  const handleNextFixture = () => {
    setPuzzleIndex((prev) => (prev + 1) % TEST_PUZZLES.length);
  };

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-4xl flex-col gap-4 px-4 py-4 sm:px-8 sm:py-6">
      {/* Top Header & Navigation */}
      <header className="flex flex-col items-center gap-3 text-center">
        <div className="flex w-full items-center justify-between border-b border-[#C49A6C]/30 pb-3">
          <Link
            href="/"
            className="rounded-full border border-[#C49A6C]/60 bg-white/90 px-4 py-1.5 text-xs font-semibold text-[#32171D] shadow-xs transition-all duration-200 ease-out hover:bg-[#faeee0] active:scale-[0.97]"
          >
            Home
          </Link>

          <span className="rounded-full border border-[#C49A6C] bg-[#faeee0] px-3.5 py-1 text-xs font-semibold text-[#7B1E2B]">
            Stage 4 • 60-Second Timed Round
          </span>

          <button
            type="button"
            onClick={handleNextFixture}
            title="Cycle to next test puzzle fixture"
            className="rounded-full border border-[#C49A6C]/60 bg-white/90 px-4 py-1.5 text-xs font-semibold text-[#32171D] shadow-xs transition-all duration-200 ease-out hover:bg-[#faeee0] active:scale-[0.97] cursor-pointer"
          >
            <span className="hidden sm:inline">
              Next Puzzle ({puzzleIndex + 1}/{TEST_PUZZLES.length})
            </span>
            <span className="sm:hidden">
              {puzzleIndex + 1}/{TEST_PUZZLES.length}
            </span>
          </button>
        </div>

        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#32171D] sm:text-4xl">
            Flipped
          </h1>
          <p className="mt-1 text-xs text-[#6B4E55] sm:text-sm">
            Semantic deduction stage test runner.
          </p>
        </div>
      </header>

      {/* Primary Game Board Surface */}
      <section className="my-4 w-full flex-1 flex flex-col justify-center">
        <GameBoard
          puzzle={currentPuzzle}
          durationSeconds={60}
          onNextPuzzle={handleNextFixture}
          nextPuzzleLabel="Next Test Fixture"
        />
      </section>

      {/* Footer Notice */}
      <footer className="border-t border-[#C49A6C]/30 pt-3 text-center text-xs text-[#6B4E55]">
        <p>Test Runner • Local Testing Fixtures Only</p>
      </footer>
    </main>
  );
}
