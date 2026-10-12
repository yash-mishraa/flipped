import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveGuestSession, attachGuestCookie } from "@/server/auth/guest-session";
import { submitAuthoritativeAttempt } from "@/server/game/attempt-service";
import { checkRateLimit } from "@/server/utils/rate-limit";

export const dynamic = "force-dynamic";

const submitSchema = z.object({
  phrase: z.string().min(1).max(100),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: attemptId } = await context.params;
  const session = resolveGuestSession(request);

  // Rate limiting against answer enumeration
  const rateLimit = checkRateLimit(`submit_${session.guestId}`, 120, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many answer submissions. Please slow down." },
      { status: 429 }
    );
  }

  let bodyData: unknown = {};
  try {
    bodyData = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const parseResult = submitSchema.safeParse(bodyData);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parseResult.error.format() },
      { status: 400 }
    );
  }

  const { phrase } = parseResult.data;
  const result = await submitAuthoritativeAttempt(attemptId, session.guestId, phrase);

  const status = result.status === "ERROR" ? 404 : 200;
  const response = NextResponse.json(result, { status });

  return attachGuestCookie(response, session);
}
