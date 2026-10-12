import { describe, it, expect } from "vitest";
import {
  getDailyDateString,
  getDailyPuzzle,
  getPublishedDailySchedule,
  DEFAULT_DAILY_TIMEZONE,
} from "@/features/game/modes/daily-scheduler";

describe("Daily Scheduler", () => {
  describe("getDailyDateString", () => {
    it("returns a strict YYYY-MM-DD formatted date string", () => {
      const fixedDate = new Date("2026-10-12T10:30:00Z");
      const dateStr = getDailyDateString(fixedDate);
      expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("defaults to Asia/Kolkata timezone", () => {
      expect(DEFAULT_DAILY_TIMEZONE).toBe("Asia/Kolkata");

      // 2026-10-12 19:00:00 UTC is 2026-10-13 00:30:00 in Asia/Kolkata (+5:30)
      const lateUtcDate = new Date("2026-10-12T19:00:00Z");
      const kolkataDate = getDailyDateString(lateUtcDate, "Asia/Kolkata");
      const utcDate = getDailyDateString(lateUtcDate, "UTC");

      expect(kolkataDate).toBe("2026-10-13");
      expect(utcDate).toBe("2026-10-12");
    });

    it("falls back gracefully when an invalid timezone string is provided", () => {
      const fixedDate = new Date("2026-10-12T12:00:00Z");
      const result = getDailyDateString(fixedDate, "Invalid/Timezone_Name");
      expect(result).toBe("2026-10-12");
    });
  });

  describe("getDailyPuzzle", () => {
    it("returns AVAILABLE for scheduled and published daily puzzles", () => {
      const result = getDailyPuzzle("2026-10-12");
      expect(result.status).toBe("AVAILABLE");
      if (result.status === "AVAILABLE") {
        expect(result.date).toBe("2026-10-12");
        expect(result.puzzle.id).toBe("bitter-truth");
        expect(result.assignment.publicationStatus).toBe("PUBLISHED");
      }
    });

    it("returns FUTURE_UNPUBLISHED for scheduled but unpublished daily puzzles", () => {
      const result = getDailyPuzzle("2026-10-20");
      expect(result.status).toBe("FUTURE_UNPUBLISHED");
      if (result.status === "FUTURE_UNPUBLISHED") {
        expect(result.date).toBe("2026-10-20");
        expect(result.message).toContain("has not yet been published");
      }
    });

    it("returns UNAVAILABLE for unassigned calendar dates", () => {
      const result = getDailyPuzzle("2025-01-01");
      expect(result.status).toBe("UNAVAILABLE");
      if (result.status === "UNAVAILABLE") {
        expect(result.date).toBe("2025-01-01");
        expect(result.message).toContain("No puzzle challenge is scheduled");
      }
    });
  });

  describe("getPublishedDailySchedule", () => {
    it("returns only published assignments", () => {
      const schedule = getPublishedDailySchedule();
      expect(schedule.length).toBeGreaterThan(0);
      expect(schedule.every((item) => item.publicationStatus === "PUBLISHED")).toBe(true);
      expect(schedule.some((item) => item.puzzleId === "light-house")).toBe(false);
    });
  });
});
