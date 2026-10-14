import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import StatisticsPage from "@/app/stats/page";
import {
  saveProgress,
  clearProgress,
  INITIAL_PROGRESS_DATA,
} from "@/features/game/persistence/local-progress";
import * as clerkNextjs from "@clerk/nextjs";

describe("StatisticsPage Component", () => {
  beforeEach(() => {
    clearProgress();
    vi.restoreAllMocks();
  });

  it("prompts the player to sign in when not authenticated", () => {
    vi.spyOn(clerkNextjs, "useUser").mockReturnValue({
      isSignedIn: false,
      user: null,
      isLoaded: true,
    } as ReturnType<typeof clerkNextjs.useUser>);

    render(<StatisticsPage />);

    expect(screen.getByRole("heading", { name: "Player Statistics" })).toBeInTheDocument();
    expect(screen.getByText("Sign In to View Your Statistics")).toBeInTheDocument();
    expect(
      screen.getByText(/You should first sign in to see your statistics/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Sign In to Account")).toBeInTheDocument();
    expect(screen.getByText("Create Free Account")).toBeInTheDocument();
  });

  it("renders empty state when signed in but no games have been played", () => {
    vi.spyOn(clerkNextjs, "useUser").mockReturnValue({
      isSignedIn: true,
      user: {
        id: "user_test_123",
        fullName: "Test Player",
      } as unknown as ReturnType<typeof clerkNextjs.useUser>["user"],
      isLoaded: true,
    } as ReturnType<typeof clerkNextjs.useUser>);

    saveProgress(INITIAL_PROGRESS_DATA);
    render(<StatisticsPage />);

    expect(screen.getByRole("heading", { name: "Player Statistics" })).toBeInTheDocument();
    expect(screen.getByText("No Games Completed Yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Play Daily Challenge/i })).toHaveAttribute(
      "href",
      "/daily"
    );
  });

  it("renders player KPIs and sync status when signed in with completed games", () => {
    vi.spyOn(clerkNextjs, "useUser").mockReturnValue({
      isSignedIn: true,
      user: {
        id: "user_test_123",
        fullName: "Test Player",
      } as unknown as ReturnType<typeof clerkNextjs.useUser>["user"],
      isLoaded: true,
    } as ReturnType<typeof clerkNextjs.useUser>);

    saveProgress({
      version: 1,
      daily: {
        "2026-10-12": {
          date: "2026-10-12",
          puzzleId: "daily-1",
          status: "WON",
          finalScore: 92,
          elapsedSeconds: 18,
          hintsUsed: 0,
          completedAt: "2026-10-12T12:00:00Z",
        },
      },
      classic: {
        recentlyPlayedIds: ["c-1"],
        lastDifficulty: "MEDIUM",
        totalPlayed: 5,
        totalWins: 4,
      },
    });

    render(<StatisticsPage />);

    // Total games: 1 + 5 = 6
    expect(screen.getByText("Games Played")).toBeInTheDocument();
    expect(screen.getByText("Total Solved")).toBeInTheDocument();
    expect(screen.getByText("Win Rate")).toBeInTheDocument();
    expect(screen.getByText("Test Player")).toBeInTheDocument();

    // Check tab switching
    const dailyTab = screen.getByRole("tab", { name: "Daily Challenge" });
    fireEvent.click(dailyTab);
    expect(dailyTab).toHaveAttribute("aria-selected", "true");

    const classicTab = screen.getByRole("tab", { name: "Classic Practice" });
    fireEvent.click(classicTab);
    expect(classicTab).toHaveAttribute("aria-selected", "true");
  });
});
