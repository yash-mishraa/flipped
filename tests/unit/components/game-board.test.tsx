import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { GameBoard } from "@/features/game/components/GameBoard";
import { TEST_PUZZLES } from "@/features/game/data/test-puzzles";

describe("GameBoard Integration Component", () => {
  const fastFoodPuzzle = TEST_PUZZLES[0]!; // SLOW + MEAL -> FAST FOOD

  it("renders clue words with their respective semantic relationships", () => {
    render(<GameBoard puzzle={fastFoodPuzzle} />);

    expect(screen.getByText("SLOW")).toBeInTheDocument();
    expect(screen.getByText("ANTONYM")).toBeInTheDocument();

    expect(screen.getByText("MEAL")).toBeInTheDocument();
    expect(screen.getByText("SYNONYM")).toBeInTheDocument();
  });

  it("enters letters and automatically wins upon completing the target phrase", () => {
    render(<GameBoard puzzle={fastFoodPuzzle} />);

    const input = screen.getByLabelText("Letter input for active tile");

    // Word 0: F is fixed. Enter A, S, T
    fireEvent.keyDown(input, { key: "a" });
    fireEvent.keyDown(input, { key: "s" });
    fireEvent.keyDown(input, { key: "t" });

    // Word 1: F is fixed. Enter O, O, D
    fireEvent.keyDown(input, { key: "o" });
    fireEvent.keyDown(input, { key: "o" });

    // Victory banner should NOT be present yet
    expect(screen.queryByTestId("victory-banner")).not.toBeInTheDocument();

    // Enter final letter 'D'
    fireEvent.keyDown(input, { key: "d" });

    // Automatic win triggered immediately!
    const victoryBanner = screen.getByTestId("victory-banner");
    expect(victoryBanner).toBeInTheDocument();
    expect(screen.getByText("Puzzle Solved!")).toBeInTheDocument();
    expect(screen.getByText("FAST FOOD")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument(); // 100 points
  });

  it("allows using hints which reveal letters and updates penalty score", () => {
    render(<GameBoard puzzle={fastFoodPuzzle} />);

    const hintButton = screen.getByRole("button", { name: /Use a hint/i });
    expect(hintButton).toBeInTheDocument();

    // Click hint button
    fireEvent.click(hintButton);

    // Tile (0, 1) should now have revealed 'A'
    const tileA = screen.getByTestId("tile-0-1");
    expect(tileA).toHaveTextContent("A");
    expect(tileA).toHaveAttribute("data-feedback", "CONFIRMED");

    // Score in status indicator should reflect hint penalty (95)
    expect(screen.getByText(/Current Score:/i)).toBeInTheDocument();
    expect(screen.getByText("95")).toBeInTheDocument();
  });

  it("allows restarting to a fresh untimed round after winning", () => {
    render(<GameBoard puzzle={fastFoodPuzzle} />);

    const input = screen.getByLabelText("Letter input for active tile");

    // Solve the puzzle
    fireEvent.keyDown(input, { key: "a" });
    fireEvent.keyDown(input, { key: "s" });
    fireEvent.keyDown(input, { key: "t" });
    fireEvent.keyDown(input, { key: "o" });
    fireEvent.keyDown(input, { key: "o" });
    fireEvent.keyDown(input, { key: "d" });

    expect(screen.getByText("Puzzle Solved!")).toBeInTheDocument();

    // Click restart
    const playAgainBtn = screen.getByRole("button", { name: /Play Fresh Round/i });
    fireEvent.click(playAgainBtn);

    // Victory banner dismissed, tiles reset to blank
    expect(screen.queryByTestId("victory-banner")).not.toBeInTheDocument();
    expect(screen.getByTestId("tile-0-1")).toHaveTextContent("");
  });
});
