import { NextResponse } from "next/server";
import { resolveGuestSession, attachGuestCookie } from "@/server/auth/guest-session";
import { getServerDailyDateString } from "@/server/scheduling/daily-scheduler";
import { inMemoryDb } from "@/server/db/client";
import {
  ATTEMPT_COOKIE_NAME,
  verifyAttemptToken,
  persistAttempt,
  attachAttemptCookie,
} from "@/server/auth/attempt-session";
import { extractCookie } from "@/server/auth/guest-session";
import {
  getPrivilegedPuzzleById,
  createFinalizedResultPayload,
} from "@/server/puzzles/puzzle-repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  const session = resolveGuestSession(request);
  const todayStr = getServerDailyDateString();

  let attempt = inMemoryDb.findDailyAttempt(session.guestId, todayStr);

  if (!attempt) {
    const rawToken = extractCookie(request.headers.get("cookie"), ATTEMPT_COOKIE_NAME);
    const fromCookie = verifyAttemptToken(rawToken);
    if (
      fromCookie &&
      fromCookie.guestId === session.guestId &&
      fromCookie.mode === "DAILY" &&
      fromCookie.dailyDate === todayStr
    ) {
      attempt = persistAttempt(fromCookie);
    }
  }

  if (!attempt) {
    const response = NextResponse.json({
      date: todayStr,
      status: "UNPLAYED",
      hasCompleted: false,
    });
    return attachGuestCookie(response, session);
  }

  const now = Date.now();
  const isExpired = now >= attempt.deadline.getTime();

  if (attempt.status !== "ACTIVE" || isExpired) {
    // If expired while away, finalize
    if (attempt.status === "ACTIVE" && isExpired) {
      attempt.status = "TIMED_OUT";
      attempt.isWon = false;
      attempt.finalScore = 0;
      attempt.endedAt = new Date(attempt.deadline.getTime());
      persistAttempt(attempt);
    }

    const puzzle = await getPrivilegedPuzzleById(attempt.puzzleId);
    const result = puzzle ? createFinalizedResultPayload(puzzle, attempt) : null;

    const response = NextResponse.json({
      date: todayStr,
      status: "COMPLETED",
      hasCompleted: true,
      result,
    });
    const withGuest = attachGuestCookie(response, session);
    return attachAttemptCookie(withGuest, attempt);
  }

  // Active in progress
  const response = NextResponse.json({
    date: todayStr,
    status: "IN_PROGRESS",
    hasCompleted: false,
    attemptId: attempt.id,
    deadline: attempt.deadline.toISOString(),
  });
  const withGuest = attachGuestCookie(response, session);
  return attachAttemptCookie(withGuest, attempt);
}
