import { NextResponse } from "next/server";
import { resolveGuestSession, attachGuestCookie } from "@/server/auth/guest-session";
import { resolveAuthoritativeAttempt, attachAttemptCookie } from "@/server/auth/attempt-session";
import { getPrivilegedPuzzleById } from "@/server/puzzles/puzzle-repository";
import { processAuthoritativeHint } from "@/server/game/hint-service";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: attemptId } = await context.params;
  const session = resolveGuestSession(request);

  const attempt = await resolveAuthoritativeAttempt(attemptId, session.guestId, request);
  if (!attempt || attempt.guestId !== session.guestId) {
    return NextResponse.json({ error: "Attempt not found or unauthorized." }, { status: 404 });
  }

  const puzzle = await getPrivilegedPuzzleById(attempt.puzzleId);
  if (!puzzle) {
    return NextResponse.json({ error: "Puzzle data missing." }, { status: 404 });
  }

  let enteredWords: readonly [string, string] | undefined;
  try {
    const body: unknown = await request.json();
    if (
      typeof body === "object" && body !== null && "enteredWords" in body &&
      Array.isArray(body.enteredWords) && body.enteredWords.length === 2 &&
      body.enteredWords.every((word) => typeof word === "string" && /^[a-z\s]*$/i.test(word))
    ) {
      enteredWords = body.enteredWords as [string, string];
    }
  } catch {
    // Older clients may send no body; the server still returns a safe hint.
  }

  const result = await processAuthoritativeHint(attempt, puzzle, enteredWords);

  const status = result.success ? 200 : 400;
  const response = NextResponse.json(result, { status });

  const withGuest = attachGuestCookie(response, session);
  if (result.attempt) {
    return attachAttemptCookie(withGuest, result.attempt);
  }
  return withGuest;
}
