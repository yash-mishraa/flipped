import { inMemoryDb } from "../db/client";
import { extractCookie } from "../auth/guest-session";
import { getAssignmentForDate } from "@/features/game/data/daily-schedule";
import { isValidCalendarDate } from "@/features/game/domain/calendar-date";

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
 * Returns the timezone of the server runtime.
 *
 * The daily challenge follows each player's local clock, so there is no global
 * "UTC" game timezone. This value is only a last-resort fallback when a request
 * does not carry any timezone information at all.
 */
export function getRuntimeTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && isValidTimezone(tz)) {
      return tz;
    }
  } catch {
    // Environment does not expose a timezone
  }
  return "";
}

export function getServerTimezone(): string {
  return getRuntimeTimezone();
}

/**
 * Resolves the player's authoritative timezone from the incoming request.
 * Hierarchy:
 * 1. Explicit client timezone header (x-timezone) — the device's real zone
 * 2. Player timezone cookie (flipped_tz) — persisted device zone
 * 3. Edge geolocation IP timezone (x-vercel-ip-timezone) — fallback proxy
 * 4. Query param (?tz=...)
 * 5. Runtime timezone fallback (never a forced UTC timezone)
 *
 * The device's own timezone wins over IP geolocation so a player on a VPN or
 * travelling still gets the new puzzle at *their* local midnight.
 */
export function resolveRequestTimezone(request?: Request): string {
  if (!request) return getServerTimezone();

  // 1. Explicit client header
  const headerTz = request.headers.get("x-timezone");
  if (headerTz && isValidTimezone(headerTz)) {
    return headerTz;
  }

  // 2. Client cookie
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const cookieTz = extractCookie(cookieHeader, "flipped_tz");
    if (cookieTz && isValidTimezone(cookieTz)) {
      return cookieTz;
    }
  }

  // 3. Edge IP geolocation header (Vercel / Cloudflare / edge reverse proxy)
  const edgeTz = request.headers.get("x-vercel-ip-timezone");
  if (edgeTz && isValidTimezone(edgeTz)) {
    return edgeTz;
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
 * This avoids depending on any locale's output order.
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
 * Falls back to the runtime's local calendar fields (never a forced UTC date).
 * Returns strict YYYY-MM-DD.
 */
export function getServerDailyDateString(
  date: Date = new Date(),
  timezone: string = getServerTimezone()
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
 * Resolves the authoritative daily puzzle assignment.
 *
 * The requested calendar date is compared against the current date in the
 * player's resolved timezone. This is what makes the puzzle unlock at the
 * player's exact local midnight while still preventing access to future days.
 *
 * `now` is injectable so the local-midnight behaviour can be tested
 * deterministically across timezones.
 */
export async function resolveServerDailyAssignment(
  dateString: string,
  timezone: string = getServerTimezone(),
  now: Date = new Date()
): Promise<ServerDailyScheduleResult> {
  if (!isValidCalendarDate(dateString)) {
    return {
      status: "UNAVAILABLE",
      date: dateString,
      message: `No puzzle challenge is scheduled for ${dateString}.`,
    };
  }

  // Curated assignment first, then deterministic auto-scheduling fallback.
  // An UNPUBLISHED/stale database row is ignored so the daily challenge can
  // never be taken offline by an old schedule flag.
  const stored = inMemoryDb.getDailyAssignment(dateString);
  const assignment =
    stored?.publicationStatus === "PUBLISHED"
      ? {
          date: stored.date,
          puzzleId: stored.puzzleId,
          publicationStatus: stored.publicationStatus,
          note: stored.note,
        }
      : getAssignmentForDate(dateString);

  if (!assignment) {
    return {
      status: "UNAVAILABLE",
      date: dateString,
      message: `No puzzle challenge is scheduled for ${dateString}.`,
    };
  }

  const authoritativeTodayStr = getServerDailyDateString(now, timezone);
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
