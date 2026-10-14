import { inMemoryDb } from "../db/client";

export const DEFAULT_SERVER_TIMEZONE = "Asia/Kolkata";

export function getServerTimezone(): string {
  return process.env.APP_TIMEZONE || DEFAULT_SERVER_TIMEZONE;
}

/**
 * Calculates current calendar date in the configured authoritative game timezone.
 * Returns strict YYYY-MM-DD.
 */
export function getServerDailyDateString(
  date: Date = new Date(),
  timezone: string = getServerTimezone()
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
    const fallbackFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: DEFAULT_SERVER_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return fallbackFormatter.format(date);
  }
}

export type ServerDailyScheduleResult =
  | {
      readonly status: "AVAILABLE";
      readonly date: string;
      readonly puzzleId: string;
      readonly note?: string;
    }
  | {
      readonly status: "FUTURE_UNPUBLISHED";
      readonly date: string;
      readonly message: string;
    }
  | {
      readonly status: "UNAVAILABLE";
      readonly date: string;
      readonly message: string;
    };

/**
 * Resolves the authoritative daily puzzle assignment from the database.
 */
export async function resolveServerDailyAssignment(
  dateString: string
): Promise<ServerDailyScheduleResult> {
  const assignment = inMemoryDb.getDailyAssignment(dateString);

  if (!assignment) {
    return {
      status: "UNAVAILABLE",
      date: dateString,
      message: `No puzzle challenge is scheduled for ${dateString}.`,
    };
  }

  const todayStr = getServerDailyDateString();
  if (dateString > todayStr || assignment.publicationStatus !== "PUBLISHED") {
    return {
      status: "FUTURE_UNPUBLISHED",
      date: dateString,
      message: `The daily puzzle for ${dateString} has not yet been published.`,
    };
  }

  return {
    status: "AVAILABLE",
    date: dateString,
    puzzleId: assignment.puzzleId,
    note: assignment.note,
  };
}
