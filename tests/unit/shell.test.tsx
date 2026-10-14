import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import HomePage from "@/app/page";
import {
  setOnboardingCompleted,
  clearProgress,
  saveDailyAttempt,
} from "@/features/game/persistence/local-progress";

describe("Production Home Screen (HomePage)", () => {
  beforeEach(() => {
    clearProgress();
    setOnboardingCompleted(true);
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
});

