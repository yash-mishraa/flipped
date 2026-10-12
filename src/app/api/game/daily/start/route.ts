import { NextResponse } from "next/server";
import { resolveGuestSession, attachGuestCookie } from "@/server/auth/guest-session";
import { startDailyAttempt } from "@/server/game/attempt-service";
import { checkRateLimit } from "@/server/utils/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  const session = resolveGuestSession(request);

  // Rate limiting protection
  const rateLimit = checkRateLimit(`daily_start_${session.guestId}`, 30, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 }
    );
  }

  const result = await startDailyAttempt(session.guestId);

  const response = NextResponse.json(result, {
    status: result.status === "UNAVAILABLE" ? 503 : 200,
  });

  return attachGuestCookie(response, session);
}
