import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ClassicSprintBoard } from "@/features/game/components/ClassicSprintBoard";

// Mock Clerk auth
vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ isSignedIn: false, user: null }),
  SignInButton: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="clerk-sign-in">{children}</div>
  ),
  SignUpButton: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="clerk-sign-up">{children}</div>
  ),
  Show: ({ when, children }: { when: string; children: React.ReactNode }) =>
    when === "signed-out" ? <>{children}</> : null,
}));

// Mock sound effects
vi.mock("@/features/game/audio/sound-effects", () => ({
  playSound: vi.fn(),
}));

describe("ClassicSprintBoard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders sprint lobby with difficulty and duration selectors", () => {
    render(<ClassicSprintBoard />);

    expect(screen.getByText("Classic Timed Sprint")).toBeInTheDocument();
    expect(screen.getByText(/Step 1: Choose Difficulty/i)).toBeInTheDocument();
    expect(screen.getByText(/Step 2: Choose Sprint Time Limit/i)).toBeInTheDocument();
    expect(screen.getByTestId("start-game-button")).toBeInTheDocument();
  });

  it("starts sprint and renders active sprint HUD and letter grid", async () => {
    const mockPayload = {
      attemptId: "att_classic_1",
      mode: "CLASSIC",
      puzzleId: "puzzle_1",
      clueWords: ["COLD", "FIRE"],
      difficulty: "MEDIUM",
      firstLetters: ["H", "I"],
      wordLengths: [3, 3],
      startedAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 600000).toISOString(),
      hintsUsed: 0,
      transformations: [
        { clueWord: "COLD", relationship: "ANTONYM" },
        { clueWord: "FIRE", relationship: "ANTONYM" },
      ],
    };

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/game/classic/start")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: "STARTED", payload: mockPayload }),
        });
      }
      return Promise.reject(new Error("Unknown route"));
    });

    render(<ClassicSprintBoard />);

    const startButton = screen.getByTestId("start-game-button");
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByTestId("game-hud")).toBeInTheDocument();
    });

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.getByText("COLD")).toBeInTheDocument();
    expect(screen.getByText("FIRE")).toBeInTheDocument();
    expect(screen.getByText("Check Answer")).toBeInTheDocument();
  });

  it("reveals solution and flip deductions for unfinished word when sprint timer expires", async () => {
    const mockPayload = {
      attemptId: "att_classic_test",
      mode: "CLASSIC",
      puzzleId: "puzzle_unfinished",
      clueWords: ["SLOW", "MEAL"],
      difficulty: "MEDIUM",
      firstLetters: ["F", "F"],
      wordLengths: [4, 4],
      startedAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 600000).toISOString(),
      hintsUsed: 0,
      transformations: [
        { clueWord: "SLOW", relationship: "ANTONYM" },
        { clueWord: "MEAL", relationship: "SYNONYM" },
      ],
    };

    const mockTimeoutResult = {
      success: true,
      result: {
        attemptId: "att_classic_test",
        puzzleId: "puzzle_unfinished",
        status: "TIMED_OUT",
        canonicalPhrase: "FAST FOOD",
        transformations: [
          {
            clueWord: "SLOW",
            answerWord: "FAST",
            relationship: "ANTONYM",
            explanation: "Opposite of slow",
          },
          {
            clueWord: "MEAL",
            answerWord: "FOOD",
            relationship: "SYNONYM",
            explanation: "Another word for meal",
          },
        ],
      },
    };

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/game/classic/start")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: "STARTED", payload: mockPayload }),
        });
      }
      if (url.includes("/timeout")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTimeoutResult),
        });
      }
      return Promise.reject(new Error("Unknown route"));
    });

    vi.useFakeTimers();

    render(<ClassicSprintBoard />);

    // Start sprint
    const startButton = screen.getByTestId("start-game-button");
    fireEvent.click(startButton);

    // Let start sprint fetch resolve
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    // Advance sprint timer past duration (180s)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(185000);
    });

    // Restore real timers for waitFor assertions
    vi.useRealTimers();

    // Verify finished view with unfinished word card and solution
    await waitFor(() => {
      expect(screen.getByRole("region", { name: "Sprint Completed Summary" })).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId("classic-unfinished-puzzle")).toBeInTheDocument();
    });

    expect(screen.getByText("Unfinished Word When Time Expired")).toBeInTheDocument();
    expect(screen.getByText("FAST FOOD")).toBeInTheDocument();
    expect(screen.getByText("Opposite of slow")).toBeInTheDocument();
    expect(screen.getByText("Another word for meal")).toBeInTheDocument();

    // Clicking Change Settings returns cleanly to lobby
    const changeSettingsBtn = screen.getByRole("button", { name: /Change Settings/i });
    fireEvent.click(changeSettingsBtn);

    expect(screen.getByText("Classic Timed Sprint")).toBeInTheDocument();
  });

  it("displays solved words with expandable flip deductions and reveals subsequent unfinished word", async () => {
    const puzzle1 = {
      attemptId: "att_1",
      mode: "CLASSIC",
      puzzleId: "puz_1",
      clueWords: ["HOT", "DOG"],
      difficulty: "MEDIUM",
      firstLetters: ["C", "C"],
      wordLengths: [4, 3],
      startedAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 600000).toISOString(),
      hintsUsed: 0,
      transformations: [
        { clueWord: "HOT", relationship: "ANTONYM" },
        { clueWord: "DOG", relationship: "SYNONYM" },
      ],
    };

    const puzzle2 = {
      attemptId: "att_2",
      mode: "CLASSIC",
      puzzleId: "puz_2",
      clueWords: ["BIG", "APPLE"],
      difficulty: "MEDIUM",
      firstLetters: ["S", "O"],
      wordLengths: [5, 6],
      startedAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 600000).toISOString(),
      hintsUsed: 0,
      transformations: [
        { clueWord: "BIG", relationship: "ANTONYM" },
        { clueWord: "APPLE", relationship: "SYNONYM" },
      ],
    };

    let fetchCount = 0;
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/game/classic/start")) {
        fetchCount++;
        const p = fetchCount === 1 ? puzzle1 : puzzle2;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: "STARTED", payload: p }),
        });
      }
      if (url.includes("/submit")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              status: "WON",
              result: {
                solvedPhrase: "COLD CAT",
                transformations: [
                  {
                    clueWord: "HOT",
                    answerWord: "COLD",
                    relationship: "ANTONYM",
                    explanation: "Opposite of hot",
                  },
                  {
                    clueWord: "DOG",
                    answerWord: "CAT",
                    relationship: "SYNONYM",
                    explanation: "Companion animal",
                  },
                ],
              },
            }),
        });
      }
      if (url.includes("/timeout")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              result: {
                attemptId: "att_2",
                canonicalPhrase: "SMALL ORANGE",
                transformations: [
                  {
                    clueWord: "BIG",
                    answerWord: "SMALL",
                    relationship: "ANTONYM",
                    explanation: "Opposite of big",
                  },
                  {
                    clueWord: "APPLE",
                    answerWord: "ORANGE",
                    relationship: "SYNONYM",
                    explanation: "Citrus fruit",
                  },
                ],
              },
            }),
        });
      }
      return Promise.reject(new Error("Unknown route"));
    });

    vi.useFakeTimers();

    render(<ClassicSprintBoard />);

    // Start sprint
    fireEvent.click(screen.getByTestId("start-game-button"));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    // Type letters into letter input to solve puzzle 1 (COLD CAT)
    const letterInput = screen.getByLabelText("Letter input for active tile");
    fireEvent.keyDown(letterInput, { key: "O" });
    fireEvent.keyDown(letterInput, { key: "L" });
    fireEvent.keyDown(letterInput, { key: "D" });
    fireEvent.keyDown(letterInput, { key: "A" });
    fireEvent.keyDown(letterInput, { key: "T" });

    // Allow submit fetch and loadNext to settle
    await act(async () => {
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(500);
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(500);
    });

    // Advance timer to timeout on puzzle 2
    await act(async () => {
      await vi.advanceTimersByTimeAsync(185000);
    });

    vi.useRealTimers();

    await waitFor(() => {
      expect(screen.getByRole("region", { name: "Sprint Completed Summary" })).toBeInTheDocument();
    });

    // Solved puzzle 1 appears in solved list
    expect(screen.getByText("COLD CAT")).toBeInTheDocument();
    expect(screen.getByText("View Flip Deductions")).toBeInTheDocument();

    // Expand deductions for solved puzzle 1
    const deductionsToggle = screen.getByText("View Flip Deductions");
    fireEvent.click(deductionsToggle);
    expect(screen.getByText("Opposite of hot")).toBeInTheDocument();

    // Unfinished puzzle 2 appears in unfinished card with solution
    expect(screen.getByTestId("classic-unfinished-puzzle")).toBeInTheDocument();
    expect(screen.getByText("SMALL ORANGE")).toBeInTheDocument();
    expect(screen.getByText("Opposite of big")).toBeInTheDocument();
    expect(screen.getByText("Citrus fruit")).toBeInTheDocument();
  });
});
