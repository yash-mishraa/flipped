import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveGuestSession } from "@/server/auth/guest-session";
import { startClassicAttempt } from "@/server/game/attempt-service";
import { checkRateLimit } from "@/server/utils/rate-limit";

export const dynamic = "force-dynamic";

const classicStartSchema = z.object({
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  recentPuzzleIds: z.array(z.string()).default([]),
});

export async function POST(request: Request): Promise<NextResponse> {
  const { guestId, cookieToSet } = resolveGuestSession(request);

  const rateLimit = checkRateLimit(`classic_start_${guestId}`, 60, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 }
    );
  }

  let bodyData: unknown = {};
  try {
    const text = await request.text();
    if (text) {
      bodyData = JSON.parse(text);
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const parseResult = classicStartSchema.safeParse(bodyData);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parseResult.error.format() },
      { status: 400 }
    );
  }

  const { difficulty, recentPuzzleIds } = parseResult.data;
  const result = await startClassicAttempt(guestId, difficulty, recentPuzzleIds);

  const response = NextResponse.json(result, {
    status: result.status === "EMPTY_POOL" ? 404 : 200,
  });

  if (cookieToSet) {
    response.headers.set("Set-Cookie", cookieToSet);
  }

  return response;
}
