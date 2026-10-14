import { NextResponse } from "next/server";
import { resolveGuestSession, attachGuestCookie } from "@/server/auth/guest-session";
import { getAttemptResultSafe } from "@/server/game/attempt-service";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: attemptId } = await context.params;
  const session = resolveGuestSession(request);

  const outcome = await getAttemptResultSafe(attemptId, session.guestId, request);

  const status = outcome.success ? 200 : outcome.message?.includes("active") ? 403 : 404;
  const response = NextResponse.json(outcome, { status });

  return attachGuestCookie(response, session);
}
