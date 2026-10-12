import { NextResponse } from "next/server";
import { resolveGuestSession, attachGuestCookie } from "@/server/auth/guest-session";
import { getServerDailyDateString } from "@/server/scheduling/daily-scheduler";
import { inMemoryDb } from "@/server/db/client";
import {
  getPrivilegedPuzzleById,
  createFinalizedResultPayload,
} from "@/server/puzzles/puzzle-repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  const session = resolveGuestSession(request);
  const todayStr = getServerDailyDateString();

  const attempt = inMemoryDb.findDailyAttempt(session.guestId, todayStr);

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
      inMemoryDb.saveAttempt(attempt);
    }

    const puzzle = await getPrivilegedPuzzleById(attempt.puzzleId);
    const result = puzzle ? createFinalizedResultPayload(puzzle, attempt) : null;

    const response = NextResponse.json({
      date: todayStr,
      status: "COMPLETED",
      hasCompleted: true,
      result,
    });
    return attachGuestCookie(response, session);
  }

  // Active in progress
  const response = NextResponse.json({
    date: todayStr,
    status: "IN_PROGRESS",
    hasCompleted: false,
    attemptId: attempt.id,
    deadline: attempt.deadline.toISOString(),
  });
  return attachGuestCookie(response, session);
}
