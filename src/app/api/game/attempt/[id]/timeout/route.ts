import { NextResponse } from "next/server";
import { resolveGuestSession, attachGuestCookie } from "@/server/auth/guest-session";
import { finalizeAuthoritativeTimeout } from "@/server/game/attempt-service";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: attemptId } = await context.params;
  const session = resolveGuestSession(request);

  const outcome = await finalizeAuthoritativeTimeout(attemptId, session.guestId);

  const status = outcome.success ? 200 : 400;
  const response = NextResponse.json(outcome, { status });

  return attachGuestCookie(response, session);
}
