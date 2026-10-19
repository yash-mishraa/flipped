import { describe, it, expect } from "vitest";
import {
  getDailyDateString,
  getDailyPuzzle,
  getDailyScheduleStatus,
  getPublishedDailySchedule,
  getClientTimezone,
  getRuntimeTimezone,
  getMillisecondsUntilNextLocalMidnight,
  formatCountdown,
} from "@/features/game/modes/daily-scheduler";
import {
  getServerDailyDateString,
  resolveRequestTimezone,
  resolveServerDailyAssignment,
} from "@/server/scheduling/daily-scheduler";
import {
  getAssignmentForDate,
  getAssignmentsThrough,
  PUBLISHED_DAILY_SCHEDULE,
} from "@/features/game/data/daily-schedule";
import { PUZZLES_BY_ID } from "@/features/game/data/puzzles";
import {
  addCalendarDays,
  daysBetweenCalendarDates,
  nextCalendarDate,
  previousCalendarDate,
} from "@/features/game/domain/calendar-date";

const DAILY_TIMEZONES = [
  "Pacific/Kiritimati", // UTC+14, first to reach a new date
  "Pacific/Auckland",
  "Asia/Kolkata",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "Pacific/Pago_Pago", // UTC-11, last to reach a new date
] as const;

describe("Daily Scheduler", () => {
  describe("getDailyDateString", () => {
    it("returns a strict YYYY-MM-DD formatted date string", () => {
      const fixedDate = new Date("2026-10-12T10:30:00Z");
      const dateStr = getDailyDateString(fixedDate);
      expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("projects the calendar date correctly in every timezone", () => {
      // 19:00 UTC is already the next day in UTC+5:30 and UTC+14.
      const lateUtcDate = new Date("2026-10-12T19:00:00Z");

      expect(getDailyDateString(lateUtcDate, "UTC")).toBe("2026-10-12");
      expect(getDailyDateString(lateUtcDate, "Asia/Kolkata")).toBe("2026-10-13");
      expect(getDailyDateString(lateUtcDate, "America/New_York")).toBe("2026-10-12");
      expect(getDailyDateString(lateUtcDate, "Pacific/Kiritimati")).toBe("2026-10-13");
      expect(getDailyDateString(lateUtcDate, "Pacific/Pago_Pago")).toBe("2026-10-12");
    });

    it("rolls over exactly at local midnight, not at UTC midnight", () => {
      // 18:29:59 UTC = 23:59:59 IST on Oct 12; one second later is Oct 13 IST.
      expect(getDailyDateString(new Date("2026-10-12T18:29:59.000Z"), "Asia/Kolkata")).toBe(
        "2026-10-12"
      );
      expect(getDailyDateString(new Date("2026-10-12T18:30:00.000Z"), "Asia/Kolkata")).toBe(
        "2026-10-13"
      );

      // In UTC, both instants are still Oct 12.
      expect(getDailyDateString(new Date("2026-10-12T18:30:00.000Z"), "UTC")).toBe("2026-10-12");
    });

    it("falls back to runtime-local calendar fields for an invalid timezone", () => {
      const fixedDate = new Date("2026-10-12T12:00:00Z");
      const expected = [
        fixedDate.getFullYear(),
        String(fixedDate.getMonth() + 1).padStart(2, "0"),
        String(fixedDate.getDate()).padStart(2, "0"),
      ].join("-");

      expect(getDailyDateString(fixedDate, "Invalid/Timezone_Name")).toBe(expected);
      expect(getDailyDateString(fixedDate, "")).toBe(expected);
    });

    it("exposes the runtime timezone without forcing UTC", () => {
      const tz = getRuntimeTimezone();
      expect(typeof tz).toBe("string");
      expect(getClientTimezone()).toBe(tz);
    });
  });

  describe("Local Midnight Countdown", () => {
    it("calculates the countdown to the next local midnight accurately", () => {
      // 23:59:50 UTC: 10 seconds before midnight.
      expect(
        getMillisecondsUntilNextLocalMidnight(new Date("2026-10-12T23:59:50.000Z"), "UTC")
      ).toBe(10_000);

      // 18:29:50 UTC = 23:59:50 IST: 10 seconds before local midnight.
      const kolkataMs = getMillisecondsUntilNextLocalMidnight(
        new Date("2026-10-12T18:29:50.000Z"),
        "Asia/Kolkata"
      );
      expect(kolkataMs).toBe(10_000);
      expect(formatCountdown(kolkataMs)).toBe("00:00:10");

      // Sub-second precision is preserved.
      expect(
        getMillisecondsUntilNextLocalMidnight(new Date("2026-10-12T23:59:59.500Z"), "UTC")
      ).toBe(500);
    });

    it("handles the 23-hour spring-forward DST day", () => {
      // 2026-03-08 00:00 in New York (EST) to 2026-03-09 00:00 (EDT) is 23 hours.
      const ms = getMillisecondsUntilNextLocalMidnight(
        new Date("2026-03-08T05:00:00.000Z"),
        "America/New_York"
      );
      expect(ms).toBe(23 * 60 * 60 * 1000);
    });

    it("handles the 25-hour fall-back DST day", () => {
      // 2026-11-01 00:00 in New York (EDT) to 2026-11-02 00:00 (EST) is 25 hours.
      const ms = getMillisecondsUntilNextLocalMidnight(
        new Date("2026-11-01T04:00:00.000Z"),
        "America/New_York"
      );
      expect(ms).toBe(25 * 60 * 60 * 1000);
    });

    it("is never negative and always lands on the next local calendar day", () => {
      for (const tz of DAILY_TIMEZONES) {
        const now = new Date("2026-10-20T12:34:56.789Z");
        const ms = getMillisecondsUntilNextLocalMidnight(now, tz);
        expect(ms).toBeGreaterThan(0);
        expect(ms).toBeLessThanOrEqual(26 * 60 * 60 * 1000);

        const boundary = new Date(now.getTime() + ms);
        expect(getDailyDateString(boundary, tz)).toBe(
          addCalendarDays(getDailyDateString(now, tz), 1)
        );
      }
    });
  });

  describe("Server Timezone & Anti-Cheat Validation", () => {
    it("prefers the device timezone over IP geolocation and cookie", () => {
      const request = new Request("http://localhost/api/game/daily/status", {
        headers: {
          "x-timezone": "Asia/Kolkata",
          "x-vercel-ip-timezone": "America/New_York",
          cookie: "flipped_tz=Europe/London",
        },
      });
      expect(resolveRequestTimezone(request)).toBe("Asia/Kolkata");
    });

    it("falls back to the persisted cookie and then the edge timezone", () => {
      const cookieRequest = new Request("http://localhost/api/game/daily/status", {
        headers: {
          "x-vercel-ip-timezone": "America/New_York",
          cookie: "flipped_tz=Europe/London",
        },
      });
      expect(resolveRequestTimezone(cookieRequest)).toBe("Europe/London");

      const edgeRequest = new Request("http://localhost/api/game/daily/status", {
        headers: {
          "x-vercel-ip-timezone": "America/New_York",
        },
      });
      expect(resolveRequestTimezone(edgeRequest)).toBe("America/New_York");
    });

    it("unlocks exactly at the player's local midnight even while UTC is still yesterday", () => {
      // 18:29:59 UTC = 23:59:59 IST on Oct 19 -> Oct 20 is not available yet.
      const justBeforeMidnight = new Date("2026-10-19T18:29:59.000Z");
      expect(getServerDailyDateString(justBeforeMidnight, "Asia/Kolkata")).toBe("2026-10-19");
      expect(getServerDailyDateString(justBeforeMidnight, "UTC")).toBe("2026-10-19");

      // 18:30:00 UTC = 00:00:00 IST on Oct 20 -> the new day is available.
      const atMidnight = new Date("2026-10-19T18:30:00.000Z");
      expect(getServerDailyDateString(atMidnight, "Asia/Kolkata")).toBe("2026-10-20");
      expect(getServerDailyDateString(atMidnight, "UTC")).toBe("2026-10-19");
    });

    it("returns FUTURE_UNPUBLISHED one second before local midnight and AVAILABLE at local midnight", async () => {
      const before = await resolveServerDailyAssignment(
        "2026-10-20",
        "Asia/Kolkata",
        new Date("2026-10-19T18:29:59.000Z")
      );
      expect(before.status).toBe("FUTURE_UNPUBLISHED");

      const atMidnight = await resolveServerDailyAssignment(
        "2026-10-20",
        "Asia/Kolkata",
        new Date("2026-10-19T18:30:00.000Z")
      );
      expect(atMidnight.status).toBe("AVAILABLE");
      if (atMidnight.status === "AVAILABLE") {
        expect(atMidnight.puzzleId).toBe("light-house");
      }
    });

    it("does not use UTC as a stand-in for the player's timezone", async () => {
      const instant = new Date("2026-10-19T18:30:00.000Z");

      // For an IST player it is already Oct 20...
      const ist = await resolveServerDailyAssignment("2026-10-20", "Asia/Kolkata", instant);
      expect(ist.status).toBe("AVAILABLE");

      // ...but for a UTC-clock request the same date is still in the future.
      const utc = await resolveServerDailyAssignment("2026-10-20", "UTC", instant);
      expect(utc.status).toBe("FUTURE_UNPUBLISHED");
    });

    it("applies local midnight to auto-scheduled dates beyond the curated schedule", async () => {
      const instant = new Date("2026-12-01T18:30:00.000Z"); // 2026-12-02 00:00 IST

      const before = await resolveServerDailyAssignment(
        "2026-12-02",
        "Asia/Kolkata",
        new Date(instant.getTime() - 1000)
      );
      expect(before.status).toBe("FUTURE_UNPUBLISHED");

      const atMidnight = await resolveServerDailyAssignment("2026-12-02", "Asia/Kolkata", instant);
      expect(atMidnight.status).toBe("AVAILABLE");
      if (atMidnight.status === "AVAILABLE") {
        expect(PUZZLES_BY_ID.has(atMidnight.puzzleId)).toBe(true);
      }
    });

    it("allows past published daily puzzles for all timezones", async () => {
      for (const timezone of DAILY_TIMEZONES) {
        const pastRes = await resolveServerDailyAssignment("2026-10-12", timezone);
        expect(pastRes.status).toBe("AVAILABLE");
      }
    });

    it("strictly blocks future dates as FUTURE_UNPUBLISHED regardless of timezone", async () => {
      const futureResult = await resolveServerDailyAssignment("2099-06-15", "UTC");
      expect(futureResult.status).toBe("FUTURE_UNPUBLISHED");

      const futureNyResult = await resolveServerDailyAssignment("2099-06-15", "America/New_York");
      expect(futureNyResult.status).toBe("FUTURE_UNPUBLISHED");
    });

    it("returns UNAVAILABLE for dates before the game existed", async () => {
      const ancientResult = await resolveServerDailyAssignment("2020-01-01", "UTC");
      expect(ancientResult.status).toBe("UNAVAILABLE");
    });
  });

  describe("getDailyScheduleStatus", () => {
    it("returns AVAILABLE for past or current published dates", () => {
      expect(getDailyScheduleStatus("2026-10-12", "2026-10-14")).toBe("AVAILABLE");
      expect(getDailyScheduleStatus("2026-10-14", "2026-10-14")).toBe("AVAILABLE");
    });

    it("returns FUTURE_UNPUBLISHED for future dates", () => {
      expect(getDailyScheduleStatus("2026-10-15", "2026-10-14")).toBe("FUTURE_UNPUBLISHED");
      expect(getDailyScheduleStatus("2099-06-15", "2026-10-14")).toBe("FUTURE_UNPUBLISHED");
    });

    it("returns UNAVAILABLE for dates before the game existed", () => {
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

    it("returns today's puzzle at local midnight even if UTC is still on yesterday", () => {
      // The caller passes the player's local date: IST already rolled over.
      const result = getDailyPuzzle("2026-10-20", "2026-10-20");
      expect(result.status).toBe("AVAILABLE");
      if (result.status === "AVAILABLE") {
        expect(result.puzzle.id).toBe("light-house");
      }
    });

    it("returns FUTURE_UNPUBLISHED for future dates even if auto-scheduled", () => {
      const result = getDailyPuzzle("2099-06-15", "2026-10-14");
      expect(result.status).toBe("FUTURE_UNPUBLISHED");
      if (result.status === "FUTURE_UNPUBLISHED") {
        expect(result.date).toBe("2099-06-15");
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

    it("returns UNAVAILABLE for dates before the game existed", () => {
      const result = getDailyPuzzle("2025-01-01", "2026-10-14");
      expect(result.status).toBe("UNAVAILABLE");
      if (result.status === "UNAVAILABLE") {
        expect(result.date).toBe("2025-01-01");
        expect(result.message).toContain("No puzzle challenge is scheduled");
      }
    });
  });

  describe("Auto-scheduling", () => {
    it("assigns a puzzle for every date for the next five years", () => {
      let cursor = "2026-10-26";
      const lastDate = "2031-10-26";

      while (cursor <= lastDate) {
        const assignment = getAssignmentForDate(cursor);
        expect(assignment, `missing assignment for ${cursor}`).not.toBeNull();
        expect(assignment!.publicationStatus).toBe("PUBLISHED");
        expect(PUZZLES_BY_ID.has(assignment!.puzzleId)).toBe(true);
        cursor = nextCalendarDate(cursor);
      }
    });

    it("is deterministic for the same date", () => {
      const first = getAssignmentForDate("2027-03-15");
      const second = getAssignmentForDate("2027-03-15");
      expect(first).not.toBeNull();
      expect(second!.puzzleId).toBe(first!.puzzleId);
    });

    it("advances to a different puzzle on consecutive dates", () => {
      let cursor = "2026-10-26";
      for (let i = 0; i < 60; i++) {
        const current = getAssignmentForDate(cursor);
        const next = getAssignmentForDate(nextCalendarDate(cursor));
        expect(current).not.toBeNull();
        expect(next).not.toBeNull();
        expect(next!.puzzleId).not.toBe(current!.puzzleId);
        cursor = nextCalendarDate(cursor);
      }
    });

    it("never reuses a puzzle already reserved by the curated schedule", () => {
      const curatedIds = new Set(PUBLISHED_DAILY_SCHEDULE.map((entry) => entry.puzzleId));
      let cursor = "2026-10-26";

      for (let i = 0; i < 200; i++) {
        const assignment = getAssignmentForDate(cursor);
        expect(assignment).not.toBeNull();
        expect(curatedIds.has(assignment!.puzzleId)).toBe(false);
        cursor = nextCalendarDate(cursor);
      }
    });

    it("returns null for invalid dates and dates before launch", () => {
      expect(getAssignmentForDate("2020-06-15")).toBeNull();
      expect(getAssignmentForDate("2026-02-30")).toBeNull();
      expect(getAssignmentForDate("not-a-date")).toBeNull();
      expect(getAssignmentForDate("")).toBeNull();
    });

    it("returns the curated entry for dates in the static schedule", () => {
      const result = getAssignmentForDate("2026-10-12");
      expect(result).not.toBeNull();
      expect(result!.puzzleId).toBe("bitter-truth");
    });

    it("keeps the curated schedule complete and internally consistent", () => {
      const dates = PUBLISHED_DAILY_SCHEDULE.map((entry) => entry.date);
      const puzzleIds = PUBLISHED_DAILY_SCHEDULE.map((entry) => entry.puzzleId);

      expect(new Set(dates).size).toBe(dates.length);
      expect(new Set(puzzleIds).size).toBe(puzzleIds.length);
      expect([...dates].sort()).toEqual(dates);
      expect(dates).toEqual(
        Array.from({ length: dates.length }, (_, i) => addCalendarDays(dates[0]!, i))
      );

      for (const entry of PUBLISHED_DAILY_SCHEDULE) {
        expect(entry.publicationStatus).toBe("PUBLISHED");
        expect(PUZZLES_BY_ID.has(entry.puzzleId)).toBe(true);
      }
    });
  });

  describe("Calendar date arithmetic", () => {
    it("handles leap years and month/year boundaries without timezone drift", () => {
      expect(nextCalendarDate("2028-02-28")).toBe("2028-02-29");
      expect(nextCalendarDate("2028-02-29")).toBe("2028-03-01");
      expect(nextCalendarDate("2026-12-31")).toBe("2027-01-01");
      expect(previousCalendarDate("2026-01-01")).toBe("2025-12-31");
      expect(daysBetweenCalendarDates("2026-10-06", "2026-10-26")).toBe(20);
      expect(daysBetweenCalendarDates("2026-03-08", "2026-03-09")).toBe(1);
    });
  });

  describe("getPublishedDailySchedule", () => {
    it("returns only published assignments up to the cutoff date", () => {
      const schedule = getPublishedDailySchedule("2026-10-14");
      expect(schedule.length).toBe(9);
      expect(schedule.every((item) => item.publicationStatus === "PUBLISHED")).toBe(true);
      expect(schedule.every((item) => item.date <= "2026-10-14")).toBe(true);
      expect(schedule.some((item) => item.date === "2026-10-15")).toBe(false);
      expect(schedule.some((item) => item.date === "2026-10-16")).toBe(false);
    });

    it("excludes future dates when called with default today", () => {
      const today = getDailyDateString();
      const schedule = getPublishedDailySchedule();
      expect(schedule.every((item) => item.date <= today)).toBe(true);
    });

    it("includes auto-scheduled dates beyond the static schedule", () => {
      const schedule = getPublishedDailySchedule("2026-11-15");
      expect(schedule.length).toBe(41); // Oct 6 through Nov 15 inclusive
      expect(schedule.some((item) => item.note === "Auto-scheduled Daily Challenge")).toBe(true);
      expect(schedule.some((item) => item.date === "2026-10-26")).toBe(true);
    });

    it("builds a gap-free archive from launch through any future cutoff", () => {
      const cutoff = "2030-01-01";
      const schedule = getAssignmentsThrough(cutoff);
      const expectedLength = daysBetweenCalendarDates("2026-10-06", cutoff) + 1;
      expect(schedule.length).toBe(expectedLength);

      for (let i = 1; i < schedule.length; i++) {
        expect(schedule[i]!.date).toBe(nextCalendarDate(schedule[i - 1]!.date));
      }
    });
  });
});
