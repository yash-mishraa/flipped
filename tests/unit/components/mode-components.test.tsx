import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DifficultySelector } from "@/features/game/components/DifficultySelector";
import { DailyCompletionCard } from "@/features/game/components/DailyCompletionCard";
import { GameHUD } from "@/features/game/components/GameHUD";
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

      // Verify local midnight countdown title
      expect(screen.getByText(/Next Daily Challenge In \(Midnight\)/i)).toBeInTheDocument();
    });

    it("renders editorial Time Expired review when daily challenge times out without harsh 0-score box", () => {
      const timedOutAttempt: DailyAttemptRecord = {
        date: "2026-10-12",
        puzzleId: puzzle.id,
        status: "TIMED_OUT",
        finalScore: 0,
        elapsedSeconds: 60,
        hintsUsed: 2,
        completedAt: "2026-10-12T10:01:00.000Z",
      };

      render(<DailyCompletionCard date="2026-10-12" puzzle={puzzle} attempt={timedOutAttempt} />);

      // Editorial masthead and title
      expect(screen.getByText("Official Daily Edition")).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 2, name: "Time Expired" })).toBeInTheDocument();

      // Canonical target phrase is revealed
      expect(screen.getByText("Target Solution")).toBeInTheDocument();
      expect(screen.getByText("FAST FOOD")).toBeInTheDocument();

      // Performance ribbon with Time Taken and Hints Consulted
      expect(screen.getByText("Time Taken")).toBeInTheDocument();
      expect(screen.getByText("60s")).toBeInTheDocument();
      expect(screen.getByText("Hints Consulted")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("Daily Streak")).toBeInTheDocument();

      // Official solution grid and deductions
      expect(screen.getByText("Solution Grid")).toBeInTheDocument();
      expect(screen.getByText("Transformations Explained")).toBeInTheDocument();
      expect(screen.getByText("Official Deductions")).toBeInTheDocument();

      // Next Daily Challenge countdown
      expect(screen.getByText(/Next Daily Challenge In \(Midnight\)/i)).toBeInTheDocument();
    });
  });

  describe("GameHUD Reset Button Visibility", () => {
    const puzzle = TEST_PUZZLES[0]!;

    it("omits the Reset button when hideResetButton is true (Daily Challenge mode)", () => {
      render(
        <GameHUD
          puzzle={puzzle}
          roundStatus="PLAYING"
          formattedTime="00:45"
          urgency="normal"
          isRunning={true}
          score={90}
          hintsUsed={0}
          onStartGame={vi.fn()}
          onRestart={vi.fn()}
          hideResetButton={true}
        />
      );

      expect(screen.queryByRole("button", { name: /Restart round/i })).not.toBeInTheDocument();
      expect(screen.queryByText("Reset")).not.toBeInTheDocument();
    });

    it("renders the Reset button when hideResetButton is false/omitted (Classic mode)", () => {
      render(
        <GameHUD
          puzzle={puzzle}
          roundStatus="PLAYING"
          formattedTime="00:45"
          urgency="normal"
          isRunning={true}
          score={90}
          hintsUsed={0}
          onStartGame={vi.fn()}
          onRestart={vi.fn()}
          hideResetButton={false}
        />
      );

      expect(screen.getByRole("button", { name: /Restart round/i })).toBeInTheDocument();
      expect(screen.getByText("Reset")).toBeInTheDocument();
    });
  });
});

