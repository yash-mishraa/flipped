import { NextResponse } from "next/server";
import { resolveGuestSession } from "@/server/auth/guest-session";
import { inMemoryDb } from "@/server/db/client";
import { getPrivilegedPuzzleById } from "@/server/puzzles/puzzle-repository";
import { processAuthoritativeHint } from "@/server/game/hint-service";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: attemptId } = await context.params;
  const { guestId, cookieToSet } = resolveGuestSession(request);

  const attempt = inMemoryDb.getAttempt(attemptId);
  if (!attempt || attempt.guestId !== guestId) {
    return NextResponse.json({ error: "Attempt not found or unauthorized." }, { status: 404 });
  }

  const puzzle = await getPrivilegedPuzzleById(attempt.puzzleId);
  if (!puzzle) {
    return NextResponse.json({ error: "Puzzle data missing." }, { status: 404 });
  }

  const result = await processAuthoritativeHint(attempt, puzzle);

  const status = result.success ? 200 : 400;
  const response = NextResponse.json(result, { status });

  if (cookieToSet) {
    response.headers.set("Set-Cookie", cookieToSet);
  }

  return response;
}
