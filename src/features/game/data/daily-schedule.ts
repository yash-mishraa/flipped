import type { DailyPuzzleAssignment } from "../modes/mode-types";
import { CURATED_PUZZLES, PUZZLES_BY_ID } from "./puzzles";
import dailyPoolJson from "./daily-pool.json";
import {
  addCalendarDays,
  calendarDateToDayNumber,
  isValidCalendarDate,
} from "../domain/calendar-date";

/**
 * Curated calendar schedule for Flipped Daily challenges.
 *
 * Explicit date strings represent calendar days (YYYY-MM-DD) in the player's
 * own local timezone. The daily challenge rolls over at local midnight, so the
 * same date string means "that calendar day where the player is".
 *
 * Dates beyond this curated list are filled by `getAssignmentForDate` using a
 * deterministic auto-scheduler, which means the daily challenge can never run
 * out even if nobody updates this file.
 */
export const PUBLISHED_DAILY_SCHEDULE: readonly DailyPuzzleAssignment[] = [
  {
    date: "2026-10-06",
    puzzleId: "fast-food",
    publicationStatus: "PUBLISHED",
    note: "Tuesday Challenge",
  },
  {
    date: "2026-10-07",
    puzzleId: "deep-sleep",
    publicationStatus: "PUBLISHED",
    note: "Wednesday Challenge",
  },
  {
    date: "2026-10-08",
    puzzleId: "hot-spring",
    publicationStatus: "PUBLISHED",
    note: "Thursday Challenge",
  },
  {
    date: "2026-10-09",
    puzzleId: "sweet-dreams",
    publicationStatus: "PUBLISHED",
    note: "Friday Challenge",
  },
  {
    date: "2026-10-10",
    puzzleId: "open-door",
    publicationStatus: "PUBLISHED",
    note: "Saturday Weekend Special",
  },
  {
    date: "2026-10-11",
    puzzleId: "high-tide",
    publicationStatus: "PUBLISHED",
    note: "Sunday Feature",
  },
  {
    date: "2026-10-12",
    puzzleId: "bitter-truth",
    publicationStatus: "PUBLISHED",
    note: "Monday Opener",
  },
  {
    date: "2026-10-13",
    puzzleId: "war-cry",
    publicationStatus: "PUBLISHED",
    note: "Tuesday Challenge",
  },
  {
    date: "2026-10-14",
    puzzleId: "wild-life",
    publicationStatus: "PUBLISHED",
    note: "Wednesday Challenge",
  },
  {
    date: "2026-10-15",
    puzzleId: "cold-shoulder",
    publicationStatus: "PUBLISHED",
    note: "Thursday Challenge",
  },
  {
    date: "2026-10-16",
    puzzleId: "good-night",
    publicationStatus: "PUBLISHED",
    note: "Friday Challenge",
  },
  {
    date: "2026-10-17",
    puzzleId: "freeze-frame",
    publicationStatus: "PUBLISHED",
    note: "Saturday Special",
  },
  {
    date: "2026-10-18",
    puzzleId: "true-love",
    publicationStatus: "PUBLISHED",
    note: "Sunday Feature",
  },
  {
    date: "2026-10-19",
    puzzleId: "ancient-history",
    publicationStatus: "PUBLISHED",
    note: "Monday Opener",
  },
  {
    date: "2026-10-20",
    puzzleId: "light-house",
    publicationStatus: "PUBLISHED",
    note: "Tuesday Challenge",
  },
  {
    date: "2026-10-21",
    puzzleId: "dry-run",
    publicationStatus: "PUBLISHED",
    note: "Wednesday Challenge",
  },
  {
    date: "2026-10-22",
    puzzleId: "small-town",
    publicationStatus: "PUBLISHED",
    note: "Thursday Challenge",
  },
  {
    date: "2026-10-23",
    puzzleId: "silent-night",
    publicationStatus: "PUBLISHED",
    note: "Friday Challenge",
  },
  {
    date: "2026-10-24",
    puzzleId: "prime-time",
    publicationStatus: "PUBLISHED",
    note: "Saturday Special",
  },
  {
    date: "2026-10-25",
    puzzleId: "short-circuit",
    publicationStatus: "PUBLISHED",
    note: "Sunday Feature",
  },
];

export const DAILY_SCHEDULE_MAP: ReadonlyMap<string, DailyPuzzleAssignment> = new Map(
  PUBLISHED_DAILY_SCHEDULE.map((item) => [item.date, item])
);

// ---------------------------------------------------------------------------
// Auto-scheduling
// ---------------------------------------------------------------------------
// The calendar must always have a puzzle. Curated entries take priority; every
// other date is mapped deterministically from the corpus. Because the mapping
// uses the civil day number (not the host clock or timezone), consecutive dates
// always advance to the next puzzle in the pool and the same date always yields
// the same puzzle no matter where the request comes from.

/** The first calendar date the daily challenge was ever scheduled. */
const FIRST_SCHEDULED_DATE = PUBLISHED_DAILY_SCHEDULE[0]?.date ?? "2026-10-06";

/** Dedicated, verified duplicate-free 1,150-day puzzle pool for daily challenge. */
const AUTO_SCHEDULE_POOL: readonly string[] = (dailyPoolJson as string[]).length > 0
  ? (dailyPoolJson as readonly string[])
  : CURATED_PUZZLES.map((p) => p.id);

/**
 * Resolves the puzzle assignment for any calendar date.
 *
 * 1. Published curated schedule entries always win.
 * 2. Dates before the challenge launched return `null`.
 * 3. Every other date receives a deterministic, always-PUBLISHED assignment.
 *
 * An `UNPUBLISHED` curated entry deliberately falls through to the automatic
 * scheduler. That is a safety net: a stale editorial flag can never take the
 * daily challenge offline again. Future dates are still protected by the
 * date-vs-today check in the scheduler.
 *
 * The result is independent of the host timezone, so a player in UTC+14 and a
 * player in UTC-11 asking for the same calendar date receive the same puzzle.
 */
export function getAssignmentForDate(dateStr: string): DailyPuzzleAssignment | null {
  if (!isValidCalendarDate(dateStr)) return null;

  const curated = DAILY_SCHEDULE_MAP.get(dateStr);
  if (curated?.publicationStatus === "PUBLISHED") return curated;

  if (dateStr < FIRST_SCHEDULED_DATE) return null;
  if (AUTO_SCHEDULE_POOL.length === 0) return null;

  const dayOffset =
    calendarDateToDayNumber(dateStr) - calendarDateToDayNumber(FIRST_SCHEDULED_DATE);
  const puzzleId = AUTO_SCHEDULE_POOL[dayOffset % AUTO_SCHEDULE_POOL.length];

  if (!puzzleId) return null;

  return {
    date: dateStr,
    puzzleId,
    publicationStatus: "PUBLISHED",
    note: "Auto-scheduled Daily Challenge",
  };
}

/**
 * Returns every assignment from the launch date through `endDate` inclusive.
 * Useful for the archive and for availability checks.
 */
export function getAssignmentsThrough(endDate: string): readonly DailyPuzzleAssignment[] {
  if (!isValidCalendarDate(endDate) || endDate < FIRST_SCHEDULED_DATE) return [];

  const assignments: DailyPuzzleAssignment[] = [];
  let cursor = FIRST_SCHEDULED_DATE;

  while (cursor <= endDate) {
    const assignment = getAssignmentForDate(cursor);
    if (assignment?.publicationStatus === "PUBLISHED") {
      assignments.push(assignment);
    }
    cursor = addCalendarDays(cursor, 1);
  }

  return assignments;
}

/**
 * Returns answer words from recent daily challenges within the past `lookbackDays` (default 60 to 90).
 * Used by Classic mode to guarantee cross-mode separation.
 */
export function getRecentDailyAnswerWords(
  lookbackDays: number = 60,
  referenceDateStr?: string
): readonly string[] {
  const endDate =
    referenceDateStr && isValidCalendarDate(referenceDateStr)
      ? referenceDateStr
      : "2026-10-28";
  const words = new Set<string>();

  let cursor = endDate;
  for (let i = 0; i < lookbackDays; i++) {
    const assignment = getAssignmentForDate(cursor);
    if (assignment) {
      const puzzle = PUZZLES_BY_ID.get(assignment.puzzleId);
      if (puzzle) {
        for (const w of puzzle.answerWords) {
          if (w) words.add(w.toUpperCase());
        }
      }
    }
    cursor = addCalendarDays(cursor, -1);
    if (cursor < FIRST_SCHEDULED_DATE) break;
  }

  return [...words];
}
