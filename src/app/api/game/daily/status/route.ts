import { NextResponse } from "next/server";
import { resolveGuestSession } from "@/server/auth/guest-session";
import { getServerDailyDateString } from "@/server/scheduling/daily-scheduler";
import { inMemoryDb } from "@/server/db/client";
import {
  getPrivilegedPuzzleById,
  createFinalizedResultPayload,
} from "@/server/puzzles/puzzle-repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  const { guestId, cookieToSet } = resolveGuestSession(request);
  const todayStr = getServerDailyDateString();

  const attempt = inMemoryDb.findDailyAttempt(guestId, todayStr);

  if (!attempt) {
    const response = NextResponse.json({
      date: todayStr,
      status: "UNPLAYED",
      hasCompleted: false,
    });
    if (cookieToSet) response.headers.set("Set-Cookie", cookieToSet);
    return response;
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
    if (cookieToSet) response.headers.set("Set-Cookie", cookieToSet);
    return response;
  }

  // Active in progress
  const response = NextResponse.json({
    date: todayStr,
    status: "IN_PROGRESS",
    hasCompleted: false,
    attemptId: attempt.id,
    deadline: attempt.deadline.toISOString(),
  });
  if (cookieToSet) response.headers.set("Set-Cookie", cookieToSet);
  return response;
}
