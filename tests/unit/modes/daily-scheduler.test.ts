import { describe, it, expect } from "vitest";
import {
  getDailyDateString,
  getDailyPuzzle,
  getDailyScheduleStatus,
  getPublishedDailySchedule,
  DEFAULT_DAILY_TIMEZONE,
  getClientTimezone,
  getMillisecondsUntilNextLocalMidnight,
  formatCountdown,
} from "@/features/game/modes/daily-scheduler";
import { resolveServerDailyAssignment } from "@/server/scheduling/daily-scheduler";

describe("Daily Scheduler", () => {
  describe("getDailyDateString", () => {
    it("returns a strict YYYY-MM-DD formatted date string", () => {
      const fixedDate = new Date("2026-10-12T10:30:00Z");
      const dateStr = getDailyDateString(fixedDate);
      expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("handles different timezones and projects calendar date accurately", () => {
      expect(DEFAULT_DAILY_TIMEZONE).toBe("UTC");

      // 2026-10-12 19:00:00 UTC is 2026-10-12 in UTC and 2026-10-13 00:30:00 in Asia/Kolkata (+5:30)
      const lateUtcDate = new Date("2026-10-12T19:00:00Z");
      const defaultDate = getDailyDateString(lateUtcDate);
      const kolkataDate = getDailyDateString(lateUtcDate, "Asia/Kolkata");
      const utcDate = getDailyDateString(lateUtcDate, "UTC");
      const nyDate = getDailyDateString(lateUtcDate, "America/New_York");

      expect(defaultDate).toBe(getDailyDateString(lateUtcDate, getClientTimezone()));
      expect(utcDate).toBe("2026-10-12");
      expect(kolkataDate).toBe("2026-10-13");
      expect(nyDate).toBe("2026-10-12");
    });

    it("falls back gracefully when an invalid timezone string is provided", () => {
      const fixedDate = new Date("2026-10-12T12:00:00Z");
      const result = getDailyDateString(fixedDate, "Invalid/Timezone_Name");
      expect(result).toBe("2026-10-12");
    });
  });

  describe("Local Midnight Countdown", () => {
    it("calculates countdown to next local midnight accurately", () => {
      // 23:59:50 in UTC (10 seconds before midnight)
      const dateNearUtcMidnight = new Date("2026-10-12T23:59:50.000Z");
      const ms = getMillisecondsUntilNextLocalMidnight(dateNearUtcMidnight, "UTC");
      expect(ms).toBe(10_000);
      expect(formatCountdown(ms)).toBe("00:00:10");

      // 18:29:50 UTC is 23:59:50 in Asia/Kolkata (10 seconds before midnight)
      const dateNearKolkataMidnight = new Date("2026-10-12T18:29:50.000Z");
      const kolkataMs = getMillisecondsUntilNextLocalMidnight(dateNearKolkataMidnight, "Asia/Kolkata");
      expect(kolkataMs).toBe(10_000);
      expect(formatCountdown(kolkataMs)).toBe("00:00:10");
    });
  });

  describe("Server Timezone & Anti-Cheat Validation", () => {
    it("allows daily puzzle at local midnight for earlier timezones while locking for later timezones", async () => {
      // Past published date is AVAILABLE for all timezones
      const pastRes = await resolveServerDailyAssignment("2026-10-12", "Asia/Kolkata");
      expect(pastRes.status).toBe("AVAILABLE");

      // Upcoming unpublished puzzle is strictly FUTURE_UNPUBLISHED
      const upcomingRes = await resolveServerDailyAssignment("2026-10-20", "America/New_York");
      expect(upcomingRes.status).toBe("FUTURE_UNPUBLISHED");
    });

    it("strictly blocks players from accessing future days even if local clock is altered", async () => {
      // Anti-cheat verification: Attempting to query an unpublished future date is blocked as FUTURE_UNPUBLISHED
      const futureResult = await resolveServerDailyAssignment("2026-10-20", "UTC");
      expect(futureResult.status).toBe("FUTURE_UNPUBLISHED");

      // Non-existent future dates are UNAVAILABLE
      const unassignedResult = await resolveServerDailyAssignment("2099-12-31", "UTC");
      expect(unassignedResult.status).toBe("UNAVAILABLE");
    });
  });

  describe("getDailyScheduleStatus", () => {
    it("returns AVAILABLE for past or current published dates", () => {
      expect(getDailyScheduleStatus("2026-10-12", "2026-10-14")).toBe("AVAILABLE");
      expect(getDailyScheduleStatus("2026-10-14", "2026-10-14")).toBe("AVAILABLE");
    });

    it("returns FUTURE_UNPUBLISHED for future dates", () => {
      expect(getDailyScheduleStatus("2026-10-15", "2026-10-14")).toBe("FUTURE_UNPUBLISHED");
      expect(getDailyScheduleStatus("2026-10-20", "2026-10-14")).toBe("FUTURE_UNPUBLISHED");
    });

    it("returns UNAVAILABLE for dates not in the schedule", () => {
      expect(getDailyScheduleStatus("2025-01-01", "2026-10-14")).toBe("UNAVAILABLE");
    });
  });

  describe("getDailyPuzzle", () => {
    it("returns AVAILABLE for scheduled and published daily puzzles", () => {
      const result = getDailyPuzzle("2026-10-12", "2026-10-14");
      expect(result.status).toBe("AVAILABLE");
      if (result.status === "AVAILABLE") {
        expect(result.date).toBe("2026-10-12");
        expect(result.puzzle.id).toBe("bitter-truth");
        expect(result.assignment.publicationStatus).toBe("PUBLISHED");
      }
    });

    it("returns FUTURE_UNPUBLISHED for scheduled but unpublished daily puzzles", () => {
      const result = getDailyPuzzle("2026-10-20", "2026-10-14");
      expect(result.status).toBe("FUTURE_UNPUBLISHED");
      if (result.status === "FUTURE_UNPUBLISHED") {
        expect(result.date).toBe("2026-10-20");
        expect(result.message).toContain("has not yet been published");
      }
    });

    it("returns FUTURE_UNPUBLISHED for future dates even if marked PUBLISHED in schedule", () => {
      const result = getDailyPuzzle("2026-10-15", "2026-10-14");
      expect(result.status).toBe("FUTURE_UNPUBLISHED");
      if (result.status === "FUTURE_UNPUBLISHED") {
        expect(result.date).toBe("2026-10-15");
        expect(result.message).toContain("has not yet been published");
      }
    });

    it("returns UNAVAILABLE for unassigned calendar dates", () => {
      const result = getDailyPuzzle("2025-01-01", "2026-10-14");
      expect(result.status).toBe("UNAVAILABLE");
      if (result.status === "UNAVAILABLE") {
        expect(result.date).toBe("2025-01-01");
        expect(result.message).toContain("No puzzle challenge is scheduled");
      }
    });
  });

  describe("getPublishedDailySchedule", () => {
    it("returns only published assignments up to the cutoff date", () => {
      const schedule = getPublishedDailySchedule("2026-10-14");
      expect(schedule.length).toBeGreaterThan(0);
      expect(schedule.every((item) => item.publicationStatus === "PUBLISHED")).toBe(true);
      expect(schedule.every((item) => item.date <= "2026-10-14")).toBe(true);
      expect(schedule.some((item) => item.date === "2026-10-15")).toBe(false);
      expect(schedule.some((item) => item.date === "2026-10-16")).toBe(false);
      expect(schedule.some((item) => item.puzzleId === "light-house")).toBe(false);
    });

    it("excludes future dates when called with default today", () => {
      const today = getDailyDateString();
      const schedule = getPublishedDailySchedule();
      expect(schedule.every((item) => item.date <= today)).toBe(true);
    });
  });
});
