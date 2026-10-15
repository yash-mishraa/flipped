import React from "react";
import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ServerGameBoard } from "@/features/game/components/ServerGameBoard";
import type { SafeGameplayPayload } from "@/server/puzzles/puzzle-repository";

describe("ServerGameBoard Daily Countdown & Word Masking", () => {
  const createMockPayload = (startedAtOffsetMs = 0): SafeGameplayPayload => {
    const startedAt = new Date(Date.now() - startedAtOffsetMs);
    const deadline = new Date(startedAt.getTime() + 65_000);

    return {
      attemptId: "att_mock_123",
      mode: "DAILY",
      date: "2026-10-15",
      puzzleId: "fast-food",
      clueWords: ["SLOW", "MEAL"],
      difficulty: "MEDIUM",
      firstLetters: ["F", "F"],
      wordLengths: [4, 4],
      startedAt: startedAt.toISOString(),
      deadline: deadline.toISOString(),
      hintsUsed: 0,
      transformations: [
        { clueWord: "SLOW", relationship: "ANTONYM" },
        { clueWord: "MEAL", relationship: "SYNONYM" },
      ],
    };
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("displays 5-second countdown pop-up and masks clues & letters when starting fresh Daily challenge", () => {
    const payload = createMockPayload(0); // fresh

    render(<ServerGameBoard payload={payload} mode="DAILY" />);

    // 1. 5-Second Countdown Pop-up Modal is visible
    expect(screen.getByTestId("daily-countdown-modal")).toBeInTheDocument();
    expect(screen.getByText(/The game will start in/i)).toBeInTheDocument();
    expect(screen.getByTestId("countdown-digit")).toHaveTextContent("5");

    // 2. Status badge indicates 'Starting Soon'
    expect(screen.getByText("Starting Soon")).toBeInTheDocument();

    // 3. Clues are masked with bullets; original clue words are NOT in the document
    expect(screen.getByTestId("masked-clue-0")).toHaveTextContent("••••••");
    expect(screen.getByTestId("masked-clue-1")).toHaveTextContent("••••••");
    expect(screen.queryByText("SLOW")).not.toBeInTheDocument();
    expect(screen.queryByText("MEAL")).not.toBeInTheDocument();

    // 4. Fixed first letters ("F") are not revealed on the grid during countdown
    const tiles = screen.getAllByTestId(/^tile-/);
    for (const tile of tiles) {
      expect(tile).not.toHaveTextContent("F");
    }

    // 5. NO 'Start Game' button is present
    expect(screen.queryByTestId("start-game-button")).not.toBeInTheDocument();
  });

  it("decrements countdown digit each second and auto-starts round at 0 without any Start Game button", () => {
    const payload = createMockPayload(0);

    render(<ServerGameBoard payload={payload} mode="DAILY" />);

    // Initial state: 5
    expect(screen.getByTestId("countdown-digit")).toHaveTextContent("5");

    // Advance 1s -> 4
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId("countdown-digit")).toHaveTextContent("4");
    expect(screen.queryByText("SLOW")).not.toBeInTheDocument();

    // Advance 1s -> 3
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId("countdown-digit")).toHaveTextContent("3");

    // Advance 1s -> 2
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId("countdown-digit")).toHaveTextContent("2");

    // Advance 1s -> 1
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId("countdown-digit")).toHaveTextContent("1");

    // Advance 1s -> Countdown finishes, round activates!
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Modal unmounts
    expect(screen.queryByTestId("daily-countdown-modal")).not.toBeInTheDocument();

    // Round is now active
    expect(screen.getByText("Round Active")).toBeInTheDocument();

    // Clue words are now revealed!
    expect(screen.getByText("SLOW")).toBeInTheDocument();
    expect(screen.getByText("MEAL")).toBeInTheDocument();

    // First letters ("F") are now revealed in the letter grid!
    expect(screen.getByTestId("tile-0-0")).toHaveTextContent("F");
    expect(screen.getByTestId("tile-1-0")).toHaveTextContent("F");

    // NO Start Game button appears — timer starts automatically
    expect(screen.queryByTestId("start-game-button")).not.toBeInTheDocument();
  });

  it("skips countdown modal for an already active resumed daily attempt", () => {
    const payload = createMockPayload(15_000); // 15 seconds already elapsed

    render(<ServerGameBoard payload={payload} mode="DAILY" />);

    // No countdown modal
    expect(screen.queryByTestId("daily-countdown-modal")).not.toBeInTheDocument();

    // Round is immediately active
    expect(screen.getByText("Round Active")).toBeInTheDocument();

    // Clues and letters are visible immediately
    expect(screen.getByText("SLOW")).toBeInTheDocument();
    expect(screen.getByText("MEAL")).toBeInTheDocument();
    expect(screen.getByTestId("tile-0-0")).toHaveTextContent("F");
  });
});
