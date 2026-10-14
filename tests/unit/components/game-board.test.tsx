import React from "react";
import { render, screen, fireEvent, act, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GameBoard } from "@/features/game/components/GameBoard";
import { TEST_PUZZLES } from "@/features/game/data/test-puzzles";

describe("GameBoard Integration Component", () => {
  const fastFoodPuzzle = TEST_PUZZLES[0]!; // SLOW + MEAL -> FAST FOOD

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders clue words, initial 01:00 timer, and Start Game button in READY state", () => {
    render(<GameBoard puzzle={fastFoodPuzzle} />);

    expect(screen.getByText("SLOW")).toBeInTheDocument();
    expect(screen.getByText("MEAL")).toBeInTheDocument();
    expect(within(screen.getByLabelText("Puzzle Clues")).queryByText("ANTONYM")).not.toBeInTheDocument();
    expect(within(screen.getByLabelText("Puzzle Clues")).queryByText("SYNONYM")).not.toBeInTheDocument();

    // Prominent Start Game button and 01:00 countdown timer
    expect(screen.getByTestId("start-game-button")).toBeInTheDocument();
    expect(screen.getByText("Start Game (60s)")).toBeInTheDocument();
    expect(screen.getByText("01:00")).toBeInTheDocument();
    expect(screen.getByText("Ready to Play")).toBeInTheDocument();

    // Hint control should NOT be visible during READY state
    expect(screen.queryByRole("button", { name: /Use a hint/i })).not.toBeInTheDocument();
  });

  it("clicking Start Game transitions to PLAYING and starts the countdown timer", () => {
    render(<GameBoard puzzle={fastFoodPuzzle} />);

    const startButton = screen.getByTestId("start-game-button");
    fireEvent.click(startButton);

    // Transitions to active state
    expect(screen.getByText("Round Active")).toBeInTheDocument();
    expect(screen.queryByTestId("start-game-button")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Use a hint/i })).toBeInTheDocument();

    // Advance time by 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Timer decreases to 00:55, score updates to 99 in HUD
    expect(screen.getByText("00:55")).toBeInTheDocument();
    const hud = screen.getByTestId("game-hud");
    expect(within(hud).getByText("99")).toBeInTheDocument();
  });

  it("enters letters and automatically wins upon completing the target phrase", () => {
    render(<GameBoard puzzle={fastFoodPuzzle} />);

    // Start the game
    fireEvent.click(screen.getByTestId("start-game-button"));

    const input = screen.getByLabelText("Letter input for active tile");

    // Word 0: F is fixed. Enter A, S, T
    fireEvent.keyDown(input, { key: "a" });
    fireEvent.keyDown(input, { key: "s" });
    fireEvent.keyDown(input, { key: "t" });

    // Word 1: F is fixed. Enter O, O, D
    fireEvent.keyDown(input, { key: "o" });
    fireEvent.keyDown(input, { key: "o" });

    // Victory screen should NOT be present yet
    expect(screen.queryByTestId("success-screen")).not.toBeInTheDocument();

    // Enter final letter 'D'
    fireEvent.keyDown(input, { key: "d" });

    // Automatic win triggered immediately!
    const successScreen = screen.getAllByTestId("success-screen")[0]!;
    expect(successScreen).toBeInTheDocument();
    expect(within(successScreen).getByText("Puzzle Solved!")).toBeInTheDocument();
    expect(within(successScreen).getByText("FAST FOOD")).toBeInTheDocument();
    expect(within(successScreen).getByText("100")).toBeInTheDocument(); // 100 points
  });

  it("allows using hints which reveal letters and updates penalty score", () => {
    render(<GameBoard puzzle={fastFoodPuzzle} />);

    // Start game
    fireEvent.click(screen.getByTestId("start-game-button"));

    const hintButton = screen.getByRole("button", { name: /Use a hint/i });
    expect(hintButton).toBeInTheDocument();

    // Click hint button
    fireEvent.click(hintButton);

    // Tile (0, 1) should now have revealed 'A'
    const tileA = screen.getByTestId("tile-0-1");
    expect(tileA).toHaveTextContent("A");
    expect(tileA).toHaveAttribute("data-feedback", "CONFIRMED");

    // Score in HUD reflects hint penalty (95)
    const hud = screen.getByTestId("game-hud");
    expect(within(hud).getByText("95")).toBeInTheDocument();
  });

  it("allows restarting to a fresh round via Play Again button after winning", () => {
    render(<GameBoard puzzle={fastFoodPuzzle} />);

    // Start game
    fireEvent.click(screen.getByTestId("start-game-button"));
    const input = screen.getByLabelText("Letter input for active tile");

    // Solve the puzzle
    fireEvent.keyDown(input, { key: "a" });
    fireEvent.keyDown(input, { key: "s" });
    fireEvent.keyDown(input, { key: "t" });
    fireEvent.keyDown(input, { key: "o" });
    fireEvent.keyDown(input, { key: "o" });
    fireEvent.keyDown(input, { key: "d" });

    expect(screen.getByTestId("success-screen")).toBeInTheDocument();

    // Click Play Again
    const playAgainBtn = screen.getByTestId("play-again-button");
    fireEvent.click(playAgainBtn);

    // Victory screen dismissed, tiles reset to blank, timer back to 01:00
    expect(screen.queryByTestId("success-screen")).not.toBeInTheDocument();
    expect(screen.getByTestId("start-game-button")).toBeInTheDocument();
    expect(screen.getByText("01:00")).toBeInTheDocument();
    expect(screen.getByTestId("tile-0-1")).toHaveTextContent("");
  });

  it("transitions to TIMED_OUT when countdown expires, displaying TimeoutScreen and revealed answer", () => {
    render(<GameBoard puzzle={fastFoodPuzzle} />);

    // Start game
    fireEvent.click(screen.getByTestId("start-game-button"));

    // Advance timers by full 60 seconds
    act(() => {
      vi.advanceTimersByTime(60000);
    });

    // Timeout screen should be visible
    const timeoutScreen = screen.getByTestId("timeout-screen");
    expect(timeoutScreen).toBeInTheDocument();
    expect(within(timeoutScreen).getByText("Time Limit Reached")).toBeInTheDocument();
    expect(within(timeoutScreen).getByText("Time Ran Out!")).toBeInTheDocument();
    expect(within(timeoutScreen).getByText("FAST FOOD")).toBeInTheDocument(); // revealed answer

    // Play Again button is available on timeout screen
    const playAgainBtn = screen.getByTestId("play-again-button");
    expect(playAgainBtn).toBeInTheDocument();
    fireEvent.click(playAgainBtn);

    // Resets cleanly back to READY
    expect(screen.queryByTestId("timeout-screen")).not.toBeInTheDocument();
    expect(screen.getByTestId("start-game-button")).toBeInTheDocument();
    expect(screen.getByText("01:00")).toBeInTheDocument();
  });
});
