import { DAILY_SCHEDULE_MAP, PUBLISHED_DAILY_SCHEDULE } from "../data/daily-schedule";
import { PUZZLES_BY_ID } from "../data/puzzles";
import type { DailyPuzzleAssignment, DailyPuzzleResult } from "./mode-types";

export const DEFAULT_DAILY_TIMEZONE = "Asia/Kolkata";

/**
 * Calculates the current calendar date in the configured game timezone.
 * Defaults to Asia/Kolkata (IST).
 * Returns strict YYYY-MM-DD string.
 */
export function getDailyDateString(
  date: Date = new Date(),
  timezone: string = DEFAULT_DAILY_TIMEZONE
): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
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
