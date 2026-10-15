import React from "react";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import HomePage from "@/app/page";
import {
  setOnboardingCompleted,
  clearProgress,
  clearGuestProgress,
  setActiveUser,
  saveDailyAttempt,
} from "@/features/game/persistence/local-progress";
import { getDailyDateString } from "@/features/game/modes/daily-scheduler";
import * as clerkNextjs from "@clerk/nextjs";

describe("Production Home Screen (HomePage)", () => {
  beforeEach(() => {
    clearProgress();
    clearGuestProgress();
    setActiveUser(null);
    setOnboardingCompleted(true);
    vi.restoreAllMocks();
  });

  it("renders the game title and core challenge headline", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: "FLIPPED", level: 1 })).toBeInTheDocument();
    expect(
      screen.getByText(/Flip the meanings of two clue words to uncover a familiar phrase/i)
    ).toBeInTheDocument();
  });

  it("renders the primary action buttons: Daily Challenge, How to Play, and Auth", () => {
    render(<HomePage />);
    expect(screen.getByRole("link", { name: /Play Daily Challenge/i })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /How to Play/i })[0]).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Log In \/ Create Account/i })).toBeInTheDocument();
  });

  it("renders navigation links to Classic, Archive, and Statistics via the shell", () => {
    render(<HomePage />);
    expect(screen.getAllByRole("link", { name: /Classic/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Archive/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Statistics/i })[0]).toBeInTheDocument();
  });

  it("opens the How Flipped Works tutorial modal when How to Play is clicked", () => {
    render(<HomePage />);
    const howToPlayBtns = screen.getAllByRole("button", { name: /How to Play/i });
    expect(howToPlayBtns.length).toBeGreaterThan(0);
    fireEvent.click(howToPlayBtns[0]!);
    expect(
      screen.getByRole("heading", { name: "How Flipped Works", level: 2 })
    ).toBeInTheDocument();
  });

  it("does not render daily streak indicator for first-time visitors", () => {
    render(<HomePage />);
    expect(screen.queryByTestId("home-daily-streak")).not.toBeInTheDocument();
  });

  it("renders daily streak badge for returning players who have played daily challenges", () => {
    saveDailyAttempt({
      date: "2026-10-13",
      puzzleId: "p-test",
      status: "WON",
      finalScore: 92,
      elapsedSeconds: 18,
      hintsUsed: 0,
      solvedPhrase: "WILD LIFE",
      completedAt: "2026-10-13T12:00:00.000Z",
    });

    render(<HomePage />);
    expect(screen.getByTestId("home-daily-streak")).toBeInTheDocument();
    expect(screen.getByText("Daily Streak:")).toBeInTheDocument();
  });

  it("isolates daily streak between logged-in user and guest mode on homepage", () => {
    const todayStr = getDailyDateString();
    const testUserId = "user_loop_test_456";

    // 1. User logs in with new account
    vi.spyOn(clerkNextjs, "useUser").mockReturnValue({
      isSignedIn: true,
      user: { id: testUserId } as unknown as ReturnType<typeof clerkNextjs.useUser>["user"],
      isLoaded: true,
    } as ReturnType<typeof clerkNextjs.useUser>);

    // User plays daily challenge and wins (daily streak = 1)
    saveDailyAttempt(
      {
        date: todayStr,
        puzzleId: "p-loop",
        status: "WON",
        finalScore: 100,
        elapsedSeconds: 10,
        hintsUsed: 0,
        completedAt: new Date().toISOString(),
      },
      testUserId
    );

    const { unmount } = render(<HomePage />);
    expect(screen.getByTestId("home-daily-streak")).toBeInTheDocument();
    expect(screen.getByText("Daily Streak:")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    unmount();
    cleanup();

    // 2. User logs out -> Active user becomes guest (isSignedIn: false, user: null)
    vi.spyOn(clerkNextjs, "useUser").mockReturnValue({
      isSignedIn: false,
      user: null,
      isLoaded: true,
    } as ReturnType<typeof clerkNextjs.useUser>);

    const { unmount: unmountGuest } = render(<HomePage />);
    // When logged out, the user daily streak of 1 must NOT be visible in guest mode
    expect(screen.queryByTestId("home-daily-streak")).not.toBeInTheDocument();
    unmountGuest();
    cleanup();

    // 3. Guest plays again with guest ID without logging in and wins -> guest streak becomes 1
    saveDailyAttempt(
      {
        date: todayStr,
        puzzleId: "p-loop",
        status: "WON",
        finalScore: 90,
        elapsedSeconds: 20,
        hintsUsed: 0,
        completedAt: new Date().toISOString(),
      },
      null
    );

    render(<HomePage />);
    expect(screen.getByTestId("home-daily-streak")).toBeInTheDocument();
    expect(screen.getByText("Daily Streak:")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});

