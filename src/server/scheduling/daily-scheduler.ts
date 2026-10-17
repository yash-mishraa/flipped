import { inMemoryDb } from "../db/client";
import { extractCookie } from "../auth/guest-session";

export const DEFAULT_SERVER_TIMEZONE = "UTC";

export function getServerTimezone(): string {
  return process.env.APP_TIMEZONE || DEFAULT_SERVER_TIMEZONE;
}

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
 * Resolves the player's authoritative timezone from the incoming request.
 * Hierarchy:
 * 1. Unspoofable edge geolocation IP timezone (x-vercel-ip-timezone)
 * 2. Client-provided explicit header (x-timezone)
 * 3. Client cookie (flipped_tz)
 * 4. Query param (?tz=...)
 * 5. Configured server timezone fallback (APP_TIMEZONE or "UTC")
 */
export function resolveRequestTimezone(request?: Request): string {
  if (!request) return getServerTimezone();

  // 1. Edge IP geolocation header (Vercel / Cloudflare / edge reverse proxy)
  const edgeTz = request.headers.get("x-vercel-ip-timezone");
  if (edgeTz && isValidTimezone(edgeTz)) {
    return edgeTz;
  }

  // 2. Client header
  const headerTz = request.headers.get("x-timezone");
  if (headerTz && isValidTimezone(headerTz)) {
    return headerTz;
  }

  // 3. Client cookie
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const cookieTz = extractCookie(cookieHeader, "flipped_tz");
    if (cookieTz && isValidTimezone(cookieTz)) {
      return cookieTz;
    }
  }

  // 4. Query parameter
  try {
    const url = new URL(request.url);
    const queryTz = url.searchParams.get("tz");
    if (queryTz && isValidTimezone(queryTz)) {
      return queryTz;
    }
  } catch {
    // Ignore URL parse error
  }

  return getServerTimezone();
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
    const tz = isValidTimezone(timezone) ? timezone : DEFAULT_SERVER_TIMEZONE;
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
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
 * Strictly verifies the requested date against the server's authoritative atomic clock
 * projected into the player's resolved timezone.
 *
 * Anti-cheat: Changing local device clock forward cannot unlock future days because
 * the server validates using new Date() projected to the player's timezone.
 */
export async function resolveServerDailyAssignment(
  dateString: string,
  timezone: string = getServerTimezone()
): Promise<ServerDailyScheduleResult> {
  const assignment = inMemoryDb.getDailyAssignment(dateString);

  if (!assignment) {
    return {
      status: "UNAVAILABLE",
      date: dateString,
      message: `No puzzle challenge is scheduled for ${dateString}.`,
    };
  }

  const authoritativeTodayStr = getServerDailyDateString(new Date(), timezone);
  if (dateString > authoritativeTodayStr || assignment.publicationStatus !== "PUBLISHED") {
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
