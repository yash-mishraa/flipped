import { DAILY_SCHEDULE_MAP, PUBLISHED_DAILY_SCHEDULE } from "../data/daily-schedule";
import { PUZZLES_BY_ID } from "../data/puzzles";
import type { DailyPuzzleAssignment, DailyPuzzleResult } from "./mode-types";

export const DEFAULT_DAILY_TIMEZONE = "UTC";

/**
 * Validates whether a timezone identifier is a recognized IANA timezone string.
 */
export function isValidTimezone(tz: string | null | undefined): boolean {
  if (!tz || typeof tz !== "string") return false;
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolves the client user's local timezone.
 * Uses Intl.DateTimeFormat().resolvedOptions().timeZone in browser environments,
 * falling back cleanly to DEFAULT_DAILY_TIMEZONE ("UTC").
 */
export function getClientTimezone(): string {
  try {
    if (typeof Intl !== "undefined" && typeof Intl.DateTimeFormat === "function") {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && isValidTimezone(tz)) {
        return tz;
      }
    }
  } catch {
    // Fallback on environment error
  }
  return DEFAULT_DAILY_TIMEZONE;
}

/**
 * Calculates the current calendar date in the player's local timezone.
 * Defaults to the player's resolved client timezone.
 * Returns strict YYYY-MM-DD string.
 */
export function getDailyDateString(
  date: Date = new Date(),
  timezone: string = getClientTimezone()
): string {
  try {
    const tz = isValidTimezone(timezone) ? timezone : DEFAULT_DAILY_TIMEZONE;
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(date);
  } catch {
    // If timezone string is invalid, fallback cleanly to default timezone
    const fallbackFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: DEFAULT_DAILY_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return fallbackFormatter.format(date);
  }
}

/**
 * Calculates milliseconds remaining until the next local midnight (00:00:00) in the specified timezone.
 * This ensures players in every country/region receive their daily puzzle exactly at their local midnight.
 */
export function getMillisecondsUntilNextLocalMidnight(
  date: Date = new Date(),
  timezone: string = getClientTimezone()
): number {
  try {
    const tz = isValidTimezone(timezone) ? timezone : DEFAULT_DAILY_TIMEZONE;
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour12: false,
      hourCycle: "h23",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    }).formatToParts(date);

    let hour = 0;
    let minute = 0;
    let second = 0;

    for (const part of parts) {
      if (part.type === "hour") {
        hour = parseInt(part.value, 10);
      } else if (part.type === "minute") {
        minute = parseInt(part.value, 10);
      } else if (part.type === "second") {
        second = parseInt(part.value, 10);
      }
    }

    if (hour === 24) hour = 0;

    const secondsElapsedToday = hour * 3600 + minute * 60 + second;
    const msElapsed = secondsElapsedToday * 1000 + date.getMilliseconds();
    const msInDay = 86400 * 1000;
    const diffMs = msInDay - msElapsed;

    return Math.max(0, diffMs);
  } catch {
    const nextUtcMidnight = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1, 0, 0, 0, 0)
    );
    return Math.max(0, nextUtcMidnight.getTime() - date.getTime());
  }
}

/**
 * Formats milliseconds remaining into a HH:MM:SS countdown string.
 */
export function formatCountdown(diffMs: number): string {
  const safeMs = Math.max(0, diffMs);
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Evaluates the publication status of a daily challenge date without loading the full puzzle object.
 * Safe for client-side evaluation without leaking puzzle answers.
 */
export function getDailyScheduleStatus(
  dateString: string,
  todayStr: string = getDailyDateString()
): "AVAILABLE" | "FUTURE_UNPUBLISHED" | "UNAVAILABLE" {
  const assignment = DAILY_SCHEDULE_MAP.get(dateString);
  if (!assignment) return "UNAVAILABLE";
  if (dateString > todayStr || assignment.publicationStatus !== "PUBLISHED") {
    return "FUTURE_UNPUBLISHED";
  }
  return "AVAILABLE";
}

/**
 * Deterministically retrieves the puzzle assignment for a specific calendar date (YYYY-MM-DD).
 * Ensures future unpublished puzzles do not leak answers to the client.
 */
export function getDailyPuzzle(
  dateString: string,
  todayStr: string = getDailyDateString()
): DailyPuzzleResult {
  const assignment = DAILY_SCHEDULE_MAP.get(dateString);

  if (!assignment) {
    return {
      status: "UNAVAILABLE",
      date: dateString,
      message: `No puzzle challenge is scheduled for ${dateString}.`,
    };
  }

  if (dateString > todayStr || assignment.publicationStatus !== "PUBLISHED") {
    return {
      status: "FUTURE_UNPUBLISHED",
      date: dateString,
      message: `The daily puzzle for ${dateString} has not yet been published. Check back on that date!`,
    };
  }

  const puzzle = PUZZLES_BY_ID.get(assignment.puzzleId);
  if (!puzzle) {
    return {
      status: "UNAVAILABLE",
      date: dateString,
      message: `Puzzle data for ID "${assignment.puzzleId}" could not be loaded.`,
    };
  }

  return {
    status: "AVAILABLE",
    date: dateString,
    puzzle,
    assignment,
  };
}

/**
 * Retrieves all published daily assignments in chronological order up to today for the Archive view.
 * Ensures future scheduled dates are never visible in the archive before their calendar date arrives.
 */
export function getPublishedDailySchedule(
  currentDateStr: string = getDailyDateString()
): readonly DailyPuzzleAssignment[] {
  return PUBLISHED_DAILY_SCHEDULE.filter(
    (item) => item.publicationStatus === "PUBLISHED" && item.date <= currentDateStr
  );
}
