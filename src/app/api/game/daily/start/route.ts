import { NextResponse } from "next/server";
import { resolveGuestSession, attachGuestCookie } from "@/server/auth/guest-session";
import { attachAttemptCookie } from "@/server/auth/attempt-session";
import { startDailyAttempt } from "@/server/game/attempt-service";
import { checkRateLimit } from "@/server/utils/rate-limit";
import { auth } from "@clerk/nextjs/server";
import type { DailyAttemptRecord } from "@/features/game/modes/mode-types";

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

  let targetDate: string | undefined = undefined;
  let existingAttempt: DailyAttemptRecord | undefined = undefined;

  // 1. Check URL query params: ?date=YYYY-MM-DD
  try {
    const url = new URL(request.url);
    const qDate = url.searchParams.get("date");
    if (qDate && /^\d{4}-\d{2}-\d{2}$/.test(qDate)) {
      targetDate = qDate;
    }
  } catch {
    // Ignore URL parse error
  }

  // 2. Check JSON request body if present
  try {
    const body = await request.clone().json();
    if (body?.targetDate && /^\d{4}-\d{2}-\d{2}$/.test(body.targetDate)) {
      targetDate = body.targetDate;
    }
    if (body?.existingAttempt && typeof body.existingAttempt === "object") {
      existingAttempt = body.existingAttempt as DailyAttemptRecord;
    }
  } catch {
    // Body is empty or non-JSON
  }

  // Check Clerk user authentication if configured
  let clerkUserId: string | undefined = undefined;
  try {
    if (process.env.CLERK_SECRET_KEY) {
      const authData = await auth();
      if (authData?.userId) {
        clerkUserId = authData.userId;
      }
    }
  } catch {
    // Ignore Clerk auth error
  }

  const result = await startDailyAttempt(
    session.guestId,
    targetDate,
    request,
    existingAttempt,
    clerkUserId
  );

  const response = NextResponse.json(result, {
    status: result.status === "UNAVAILABLE" ? 503 : 200,
  });

  const withGuest = attachGuestCookie(response, session);
  if ("attempt" in result && result.attempt) {
    return attachAttemptCookie(withGuest, result.attempt);
  }
  return withGuest;
}

