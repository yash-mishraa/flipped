import { describe, it, expect } from "vitest";
import {
  calculateDailyStreaks,
  calculatePlayerStatistics,
  getDaysBetween,
  getPreviousDateString,
} from "@/features/game/modes/statistics";
import type { StoredProgressSchema } from "@/features/game/persistence/local-progress";
import type { DailyAttemptRecord } from "@/features/game/modes/mode-types";

describe("Statistics Engine", () => {
  describe("getDaysBetween and getPreviousDateString", () => {
    it("computes correct day difference between consecutive and non-consecutive dates", () => {
      expect(getDaysBetween("2026-10-12", "2026-10-13")).toBe(1);
      expect(getDaysBetween("2026-10-10", "2026-10-12")).toBe(2);
      expect(getDaysBetween("2026-10-12", "2026-10-10")).toBe(-2);
      expect(getDaysBetween("2026-10-31", "2026-11-01")).toBe(1);
    });

    it("returns previous calendar date across month and year boundaries", () => {
      expect(getPreviousDateString("2026-10-12")).toBe("2026-10-11");
      expect(getPreviousDateString("2026-11-01")).toBe("2026-10-31");
      expect(getPreviousDateString("2026-01-01")).toBe("2025-12-31");
    });
  });

  describe("calculateDailyStreaks", () => {
    it("returns 0 for empty history", () => {
      const result = calculateDailyStreaks({}, "2026-10-12");
      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(0);
    });

    it("calculates current streak when today is won", () => {
      const attempts: Record<string, DailyAttemptRecord> = {
        "2026-10-10": {
          date: "2026-10-10",
          puzzleId: "p1",
          status: "WON",
          finalScore: 90,
          elapsedSeconds: 20,
          hintsUsed: 0,
          completedAt: "2026-10-10T12:00:00Z",
        },
        "2026-10-11": {
          date: "2026-10-11",
          puzzleId: "p2",
          status: "WON",
          finalScore: 85,
          elapsedSeconds: 25,
          hintsUsed: 1,
          completedAt: "2026-10-11T12:00:00Z",
        },
        "2026-10-12": {
          date: "2026-10-12",
          puzzleId: "p3",
          status: "WON",
          finalScore: 95,
          elapsedSeconds: 15,
          hintsUsed: 0,
          completedAt: "2026-10-12T12:00:00Z",
        },
      };

      const result = calculateDailyStreaks(attempts, "2026-10-12");
      expect(result.currentStreak).toBe(3);
      expect(result.longestStreak).toBe(3);
    });

    it("maintains current streak when today is unplayed but yesterday was won", () => {
      const attempts: Record<string, DailyAttemptRecord> = {
        "2026-10-10": {
          date: "2026-10-10",
          puzzleId: "p1",
          status: "WON",
          finalScore: 90,
          elapsedSeconds: 20,
          hintsUsed: 0,
          completedAt: "2026-10-10T12:00:00Z",
        },
        "2026-10-11": {
          date: "2026-10-11",
          puzzleId: "p2",
          status: "WON",
          finalScore: 85,
          elapsedSeconds: 25,
          hintsUsed: 1,
          completedAt: "2026-10-11T12:00:00Z",
        },
      };

      // Today is 2026-10-12 (unplayed)
      const result = calculateDailyStreaks(attempts, "2026-10-12");
      expect(result.currentStreak).toBe(2);
      expect(result.longestStreak).toBe(2);
    });

    it("resets current streak to 0 if today was timed out", () => {
      const attempts: Record<string, DailyAttemptRecord> = {
        "2026-10-11": {
          date: "2026-10-11",
          puzzleId: "p1",
          status: "WON",
          finalScore: 90,
          elapsedSeconds: 20,
          hintsUsed: 0,
          completedAt: "2026-10-11T12:00:00Z",
        },
        "2026-10-12": {
          date: "2026-10-12",
          puzzleId: "p2",
          status: "TIMED_OUT",
          finalScore: 0,
          elapsedSeconds: 60,
          hintsUsed: 2,
          completedAt: "2026-10-12T12:00:00Z",
        },
      };

      const result = calculateDailyStreaks(attempts, "2026-10-12");
      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(1);
    });

    it("correctly calculates longest streak when broken by a gap or timeout", () => {
      const attempts: Record<string, DailyAttemptRecord> = {
        "2026-10-01": {
          date: "2026-10-01",
          puzzleId: "p1",
          status: "WON",
          finalScore: 90,
          elapsedSeconds: 20,
          hintsUsed: 0,
          completedAt: "2026-10-01T12:00:00Z",
        },
        "2026-10-02": {
          date: "2026-10-02",
          puzzleId: "p2",
          status: "WON",
          finalScore: 90,
          elapsedSeconds: 20,
          hintsUsed: 0,
          completedAt: "2026-10-02T12:00:00Z",
        },
        "2026-10-03": {
          date: "2026-10-03",
          puzzleId: "p3",
          status: "WON",
          finalScore: 90,
          elapsedSeconds: 20,
          hintsUsed: 0,
          completedAt: "2026-10-03T12:00:00Z",
        },
        "2026-10-04": {
          date: "2026-10-04",
          puzzleId: "p4",
          status: "TIMED_OUT",
          finalScore: 0,
          elapsedSeconds: 60,
          hintsUsed: 0,
          completedAt: "2026-10-04T12:00:00Z",
        },
        "2026-10-11": {
          date: "2026-10-11",
          puzzleId: "p5",
          status: "WON",
          finalScore: 90,
          elapsedSeconds: 20,
          hintsUsed: 0,
          completedAt: "2026-10-11T12:00:00Z",
        },
        "2026-10-12": {
          date: "2026-10-12",
          puzzleId: "p6",
          status: "WON",
          finalScore: 90,
          elapsedSeconds: 20,
          hintsUsed: 0,
          completedAt: "2026-10-12T12:00:00Z",
        },
      };

      const result = calculateDailyStreaks(attempts, "2026-10-12");
      expect(result.currentStreak).toBe(2);
      expect(result.longestStreak).toBe(3);
    });
  });

  describe("calculatePlayerStatistics", () => {
    it("handles zero games without division by zero or NaN", () => {
      const emptyProgress: StoredProgressSchema = {
        version: 1,
        daily: {},
        classic: {
          recentlyPlayedIds: [],
          lastDifficulty: "MEDIUM",
          totalPlayed: 0,
          totalWins: 0,
        },
      };

      const stats = calculatePlayerStatistics(emptyProgress, "2026-10-12");
      expect(stats.totalPlayed).toBe(0);
      expect(stats.totalWins).toBe(0);
      expect(stats.winRate).toBe(0);
      expect(stats.totalPoints).toBe(0);
      expect(stats.bestSolveTimeSeconds).toBeNull();
      expect(stats.averageSolveTimeSeconds).toBeNull();
      expect(stats.daily.winRate).toBe(0);
      expect(stats.classic.winRate).toBe(0);
      expect(Number.isNaN(stats.winRate)).toBe(false);
    });

    it("accurately computes metrics across Daily and Classic games", () => {
      const progress: StoredProgressSchema = {
        version: 1,
        daily: {
          "2026-10-11": {
            date: "2026-10-11",
            puzzleId: "p1",
            status: "WON",
            finalScore: 90,
            elapsedSeconds: 20,
            hintsUsed: 0,
            completedAt: "2026-10-11T12:00:00Z",
          },
          "2026-10-12": {
            date: "2026-10-12",
            puzzleId: "p2",
            status: "WON",
            finalScore: 80,
            elapsedSeconds: 30,
            hintsUsed: 1,
            completedAt: "2026-10-12T12:00:00Z",
          },
          "2026-10-10": {
            date: "2026-10-10",
            puzzleId: "p0",
            status: "TIMED_OUT",
            finalScore: 0,
            elapsedSeconds: 60,
            hintsUsed: 2,
            completedAt: "2026-10-10T12:00:00Z",
          },
        },
        classic: {
          recentlyPlayedIds: ["c1", "c2"],
          lastDifficulty: "HARD",
          totalPlayed: 7,
          totalWins: 5,
        },
      };

      const stats = calculatePlayerStatistics(progress, "2026-10-12");
      // Daily: 3 played, 2 won -> 67%
      expect(stats.daily.totalPlayed).toBe(3);
      expect(stats.daily.totalWins).toBe(2);
      expect(stats.daily.winRate).toBe(67);
      expect(stats.daily.totalPoints).toBe(170); // 90 + 80
      expect(stats.daily.bestSolveTimeSeconds).toBe(20);
      expect(stats.daily.averageSolveTimeSeconds).toBe(25); // (20 + 30) / 2
      expect(stats.daily.currentStreak).toBe(2);

      // Classic: 7 played, 5 won -> 71%
      expect(stats.classic.totalPlayed).toBe(7);
      expect(stats.classic.totalWins).toBe(5);
      expect(stats.classic.winRate).toBe(71);

      // Total: 3 + 7 = 10 played, 2 + 5 = 7 won -> 70%
      expect(stats.totalPlayed).toBe(10);
      expect(stats.totalWins).toBe(7);
      expect(stats.winRate).toBe(70);
      expect(stats.bestSolveTimeSeconds).toBe(20);
      expect(stats.averageSolveTimeSeconds).toBe(25);
    });

    it("accurately sums Daily and Classic points to ~1000 for 11 solved puzzles", () => {
      // User scenario: 1 Daily win with 98 points + 10 Classic wins
      const progress: StoredProgressSchema = {
        version: 1,
        daily: {
          "2026-10-14": {
            date: "2026-10-14",
            puzzleId: "daily-1",
            status: "WON",
            finalScore: 98,
            elapsedSeconds: 22,
            hintsUsed: 0,
            completedAt: "2026-10-14T12:00:00Z",
          },
        },
        classic: {
          recentlyPlayedIds: ["c1", "c2"],
          lastDifficulty: "MEDIUM",
          totalPlayed: 10,
          totalWins: 10,
          totalPoints: 920, // 10 solves averaging 92 pts
          bestSolveTimeSeconds: 8,
          totalElapsedSeconds: 120,
        },
      };

      const stats = calculatePlayerStatistics(progress, "2026-10-14");
      expect(stats.totalPlayed).toBe(11);
      expect(stats.totalWins).toBe(11);
      expect(stats.winRate).toBe(100);

      // Total points: 98 daily + 920 classic = 1018 pts (around 1000 pts!)
      expect(stats.totalPoints).toBe(1018);
      expect(stats.daily.totalPoints).toBe(98);
      expect(stats.daily.averagePoints).toBe(98);
      expect(stats.classic.totalPoints).toBe(920);
      expect(stats.classic.averagePoints).toBe(92);
      expect(stats.averagePoints).toBe(Math.round(1018 / 11)); // 93
      expect(stats.classic.bestSolveTimeSeconds).toBe(8);
      expect(stats.classic.averageSolveTimeSeconds).toBe(12); // 120 / 10
    });
  });
});
