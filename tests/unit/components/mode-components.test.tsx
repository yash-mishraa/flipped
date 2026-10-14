import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DifficultySelector } from "@/features/game/components/DifficultySelector";
import { DailyCompletionCard } from "@/features/game/components/DailyCompletionCard";
import { TEST_PUZZLES } from "@/features/game/data/test-puzzles";
import type { DailyAttemptRecord } from "@/features/game/modes/mode-types";

describe("Mode Components", () => {
  describe("DifficultySelector", () => {
    it("renders all three difficulty tiers and responds to selection", () => {
      const onSelect = vi.fn();
      render(<DifficultySelector selectedDifficulty="MEDIUM" onSelectDifficulty={onSelect} />);

      expect(screen.getByText("Easy")).toBeInTheDocument();
      expect(screen.getByText("Medium")).toBeInTheDocument();
      expect(screen.getByText("Hard")).toBeInTheDocument();

      const easyBtn = screen.getByTestId("difficulty-easy");
      fireEvent.click(easyBtn);
      expect(onSelect).toHaveBeenCalledWith("EASY");

      const hardBtn = screen.getByTestId("difficulty-hard");
      fireEvent.click(hardBtn);
      expect(onSelect).toHaveBeenCalledWith("HARD");
    });
  });

  describe("DailyCompletionCard", () => {
    const puzzle = TEST_PUZZLES[0]!;
    const attempt: DailyAttemptRecord = {
      date: "2026-10-12",
      puzzleId: puzzle.id,
      status: "WON",
      finalScore: 880,
      elapsedSeconds: 22,
      hintsUsed: 1,
      solvedPhrase: "FAST FOOD",
      completedAt: "2026-10-12T10:00:00.000Z",
    };

    it("renders completion review metrics, solved phrase, and solution grid", () => {
      render(<DailyCompletionCard date="2026-10-12" puzzle={puzzle} attempt={attempt} />);

      expect(screen.getByText("Daily Solved")).toBeInTheDocument();
      expect(screen.getByText("FAST FOOD")).toBeInTheDocument();
      expect(screen.getByText("880")).toBeInTheDocument();
      expect(screen.getByText("22s")).toBeInTheDocument();
      expect(screen.getAllByText("1").length).toBeGreaterThan(0);
      expect(screen.getByText("Streak")).toBeInTheDocument();

      // Navigation links
      expect(screen.getByRole("link", { name: /Play Classic Mode/i })).toHaveAttribute(
        "href",
        "/classic"
      );
      expect(screen.getByRole("link", { name: /Daily Archive/i })).toHaveAttribute(
        "href",
        "/archive"
      );
      expect(screen.getByRole("link", { name: /Home/i })).toHaveAttribute("href", "/");
    });
  });
});
