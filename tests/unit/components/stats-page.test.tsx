import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import StatisticsPage from "@/app/stats/page";
import {
  saveProgress,
  clearProgress,
  INITIAL_PROGRESS_DATA,
} from "@/features/game/persistence/local-progress";

describe("StatisticsPage Component", () => {
  beforeEach(() => {
    clearProgress();
  });

  it("renders empty state when no games have been played", () => {
    saveProgress(INITIAL_PROGRESS_DATA);
    render(<StatisticsPage />);

    expect(screen.getByRole("heading", { name: "Player Statistics" })).toBeInTheDocument();
    expect(screen.getByText("No Games Completed Yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Play Daily Challenge/i })).toHaveAttribute(
      "href",
      "/daily"
    );
  });

  it("renders player KPIs when games have been completed", () => {
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

    // Check tab switching
    const dailyTab = screen.getByRole("tab", { name: "Daily Challenge" });
    fireEvent.click(dailyTab);
    expect(dailyTab).toHaveAttribute("aria-selected", "true");

    const classicTab = screen.getByRole("tab", { name: "Classic Practice" });
    fireEvent.click(classicTab);
    expect(classicTab).toHaveAttribute("aria-selected", "true");
  });
});
