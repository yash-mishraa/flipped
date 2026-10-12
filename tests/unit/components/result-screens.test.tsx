import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SuccessScreen } from "@/features/game/components/SuccessScreen";
import { TimeoutScreen } from "@/features/game/components/TimeoutScreen";
import { TEST_PUZZLES } from "@/features/game/data/test-puzzles";
import type { TerminalResult } from "@/features/game/domain/types";

describe("Result Presentation Components", () => {
  const fastFoodPuzzle = TEST_PUZZLES[0]!;

  describe("SuccessScreen", () => {
    const wonTerminalResult: TerminalResult = {
      roundId: "test-round-1",
      status: "WON",
      finalScore: 95,
      elapsedSeconds: 24,
      hintsUsed: 1,
      completedAt: new Date().toISOString(),
      solvedPhrase: "FAST FOOD",
    };

    it("renders solved phrase, score, elapsed time, and transformations", () => {
      const onPlayAgain = vi.fn();
      render(
        <SuccessScreen
          puzzle={fastFoodPuzzle}
          terminalResult={wonTerminalResult}
          onPlayAgain={onPlayAgain}
        />
      );

      expect(screen.getByText("Puzzle Solved!")).toBeInTheDocument();
      expect(screen.getByText("FAST FOOD")).toBeInTheDocument();
      expect(screen.getByText("95")).toBeInTheDocument(); // score
      expect(screen.getByText("24s")).toBeInTheDocument(); // elapsed time
      expect(screen.getByText("1")).toBeInTheDocument(); // hints used

      // Transformation explanations
      expect(screen.getByText("SLOW")).toBeInTheDocument();
      expect(screen.getByText("FAST")).toBeInTheDocument();
      expect(screen.getByText("MEAL")).toBeInTheDocument();
      expect(screen.getByText("FOOD")).toBeInTheDocument();

      // Play Again button
      const playAgainBtn = screen.getByTestId("play-again-button");
      expect(playAgainBtn).toBeInTheDocument();
      fireEvent.click(playAgainBtn);
      expect(onPlayAgain).toHaveBeenCalledTimes(1);

      // Return home link
      expect(screen.getByRole("link", { name: /Home/i })).toHaveAttribute("href", "/");
    });
  });

  describe("TimeoutScreen", () => {
    const timeoutTerminalResult: TerminalResult = {
      roundId: "test-round-2",
      status: "TIMED_OUT",
      finalScore: 88,
      practiceScore: 88,
      elapsedSeconds: 60,
      hintsUsed: 0,
      completedAt: new Date().toISOString(),
    };

    it("renders encouraging timeout message, revealed canonical phrase, practice score, and transformations", () => {
      const onPlayAgain = vi.fn();
      render(
        <TimeoutScreen
          puzzle={fastFoodPuzzle}
          terminalResult={timeoutTerminalResult}
          onPlayAgain={onPlayAgain}
        />
      );

      expect(screen.getByText("Time Limit Reached")).toBeInTheDocument();
      expect(screen.getByText("Time Ran Out!")).toBeInTheDocument();
      expect(screen.getByText("FAST FOOD")).toBeInTheDocument(); // revealed answer

      // Clearly distinguishes practice score from official 0
      expect(screen.getByText("Practice Score")).toBeInTheDocument();
      expect(screen.getByText("88")).toBeInTheDocument();
      expect(screen.getByText("(Official: 0)")).toBeInTheDocument();

      // Time limit reached
      expect(screen.getByText("60s")).toBeInTheDocument();
      expect(screen.getByText("Limit reached")).toBeInTheDocument();

      // Play Again button
      const playAgainBtn = screen.getByTestId("play-again-button");
      expect(playAgainBtn).toBeInTheDocument();
      fireEvent.click(playAgainBtn);
      expect(onPlayAgain).toHaveBeenCalledTimes(1);

      // Return home link
      expect(screen.getByRole("link", { name: /Home/i })).toHaveAttribute("href", "/");
    });
  });
});
