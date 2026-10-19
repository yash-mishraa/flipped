import { getAssignmentForDate, getAssignmentsThrough } from "../data/daily-schedule";
import { PUZZLES_BY_ID } from "../data/puzzles";
import { isValidCalendarDate } from "../domain/calendar-date";
import type { DailyPuzzleAssignment, DailyPuzzleResult } from "./mode-types";

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
 * Returns the timezone of the runtime (browser or server process).
 *
 * This is intentionally the *runtime* timezone rather than a hard-coded value
 * such as UTC. The daily challenge must follow the player's own local clock.
 * If the environment cannot report a timezone, an empty string is returned and
 * callers fall back to the runtime's local calendar fields (still local time,
 * never UTC).
 */
export function getRuntimeTimezone(): string {
  try {
    if (typeof Intl !== "undefined" && typeof Intl.DateTimeFormat === "function") {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && isValidTimezone(tz)) {
        return tz;
      }
    }
  } catch {
    // Environment does not expose a timezone
  }
  return "";
}

/**
 * Resolves the client user's local timezone.
 */
export function getClientTimezone(): string {
  return getRuntimeTimezone();
}

function formatRuntimeLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const dateFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getZonedDateFormatter(timezone: string): Intl.DateTimeFormat {
  const cached = dateFormatterCache.get(timezone);
  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  dateFormatterCache.set(timezone, formatter);
  return formatter;
}

/**
 * Formats a date in a timezone by reading its calendar parts explicitly.
 * This avoids depending on any locale's output order (for example, `en-CA`
 * producing `MM/DD/YYYY` in some engine builds).
 */
function formatZonedDate(formatter: Intl.DateTimeFormat, date: Date): string | null {
  const parts = formatter.formatToParts(date);
  let year = "";
  let month = "";
  let day = "";

  for (const part of parts) {
    if (part.type === "year") year = part.value;
    else if (part.type === "month") month = part.value;
    else if (part.type === "day") day = part.value;
  }

  if (!year || !month || !day) return null;
  return `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

/**
 * Calculates the current calendar date in the player's local timezone.
 *
 * - Uses the supplied IANA timezone when valid.
 * - Otherwise uses the runtime's local calendar fields.
 *
 * There is deliberately no UTC fallback: a player at 00:00 local time must
 * receive the new day's puzzle even when UTC is still on the previous date.
 * Returns a strict YYYY-MM-DD string.
 */
export function getDailyDateString(
  date: Date = new Date(),
  timezone: string = getClientTimezone()
): string {
  if (isValidTimezone(timezone)) {
    try {
      const formatted = formatZonedDate(getZonedDateFormatter(timezone), date);
      if (formatted) return formatted;
    } catch {
      // Fall through to the runtime-local calendar fields
    }
  }
  return formatRuntimeLocalDate(date);
}

const MAX_LOCAL_DAY_MS = 27 * 60 * 60 * 1000;

/**
 * Calculates milliseconds remaining until the next local midnight.
 *
 * For IANA timezones this locates the exact instant at which the local
 * calendar date changes, using a binary search over real timestamps. That makes
 * it correct on 23-hour and 25-hour DST transition days, and in zones that
 * shift at midnight, without assuming that a day is always 86,400 seconds.
 *
 * When no timezone is available it uses the runtime's own local date
 * constructor, which is also DST-aware.
 */
export function getMillisecondsUntilNextLocalMidnight(
  date: Date = new Date(),
  timezone: string = getClientTimezone()
): number {
  if (!isValidTimezone(timezone)) {
    const nextRuntimeMidnight = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + 1,
      0,
      0,
      0,
      0
    );
    return Math.max(0, nextRuntimeMidnight.getTime() - date.getTime());
  }

  const currentDateStr = getDailyDateString(date, timezone);
  const nowMs = date.getTime();

  let low = nowMs;
  let high = nowMs + MAX_LOCAL_DAY_MS;

  // Ensure the upper bound is on the next local calendar day.
  while (
    high - nowMs < MAX_LOCAL_DAY_MS * 2 &&
    getDailyDateString(new Date(high), timezone) === currentDateStr
  ) {
    high += 60 * 60 * 1000;
  }

  // Find the first millisecond whose local date differs from today.
  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2);
    if (getDailyDateString(new Date(mid), timezone) === currentDateStr) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return Math.max(0, high - nowMs);
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
  const assignment = getAssignmentForDate(dateString);
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
  const assignment = getAssignmentForDate(dateString);

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
 * Retrieves all published daily assignments in chronological order up to today
 * for the Archive view. Includes curated entries and auto-scheduled entries, so
 * the archive always reflects every past daily challenge.
 */
export function getPublishedDailySchedule(
  currentDateStr: string = getDailyDateString()
): readonly DailyPuzzleAssignment[] {
  const cutoff = isValidCalendarDate(currentDateStr) ? currentDateStr : getDailyDateString();
  return getAssignmentsThrough(cutoff);
}
