import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { inMemoryDb } from "@/server/db/client";
import {
  calculatePlayerStatistics,
  isArchiveDailyAttempt,
  type PlayerStatistics,
} from "@/features/game/modes/statistics";
import { getServerDailyDateString } from "@/server/scheduling/daily-scheduler";
import {
  type StoredProgressSchema,
  INITIAL_PROGRESS_DATA,
} from "@/features/game/persistence/local-progress";
import type { DailyAttemptRecord } from "@/features/game/modes/mode-types";

export const dynamic = "force-dynamic";

/**
 * Resolves the authenticated Clerk userId, with fallback to request payload.
 */
async function resolveClerkUserId(request: Request, body?: { userId?: string }): Promise<string | null> {
  // 1. Try Clerk server-side auth()
  try {
    if (process.env.CLERK_SECRET_KEY) {
      const authData = await auth();
      if (authData?.userId) {
        return authData.userId;
      }
    }
  } catch {
    // In test environment or unconfigured Clerk, continue to fallback
  }

  // 2. Check body or URL params
  if (body?.userId && typeof body.userId === "string") {
    return body.userId;
  }

  try {
    const url = new URL(request.url);
    const qUserId = url.searchParams.get("userId");
    if (qUserId) return qUserId;
  } catch {
    // Ignore URL parse error
  }

  return null;
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: { userId?: string; progress?: StoredProgressSchema } | undefined;
  try {
    body = await request.json();
  } catch {
    body = undefined;
  }

  const userId = await resolveClerkUserId(request, body);
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized. You must be signed in to sync your statistics." },
      { status: 401 }
    );
  }

  const clientProgress = body?.progress;
  const existing = inMemoryDb.getUserProgress(userId) || INITIAL_PROGRESS_DATA;
  const todayStr = getServerDailyDateString();

  // Merge daily challenge attempts
  const mergedDaily: Record<string, DailyAttemptRecord> = { ...existing.daily };

  if (clientProgress?.daily) {
    for (const [date, clientAttempt] of Object.entries(clientProgress.daily)) {
      const isArchive = isArchiveDailyAttempt(clientAttempt);
      const normalizedClientAttempt: DailyAttemptRecord = {
        ...clientAttempt,
        isArchive: clientAttempt.isArchive ?? isArchive,
      };
      const serverAttempt = mergedDaily[date];
      if (!serverAttempt) {
        mergedDaily[date] = normalizedClientAttempt;
      } else {
        const mergedIsArchive = Boolean(serverAttempt.isArchive || normalizedClientAttempt.isArchive);
        // Prefer completed / won attempt
        if (normalizedClientAttempt.status === "WON" && serverAttempt.status !== "WON") {
          mergedDaily[date] = { ...normalizedClientAttempt, isArchive: mergedIsArchive };
        } else if (normalizedClientAttempt.status === "WON" && serverAttempt.status === "WON") {
          // Keep attempt with higher finalScore or shorter time
          const clientScore = normalizedClientAttempt.finalScore ?? 0;
          const serverScore = serverAttempt.finalScore ?? 0;
          if (clientScore > serverScore) {
            mergedDaily[date] = { ...normalizedClientAttempt, isArchive: mergedIsArchive };
          } else if (
            clientScore === serverScore &&
            (normalizedClientAttempt.elapsedSeconds ?? 999) < (serverAttempt.elapsedSeconds ?? 999)
          ) {
            mergedDaily[date] = { ...normalizedClientAttempt, isArchive: mergedIsArchive };
          } else {
            mergedDaily[date] = { ...serverAttempt, isArchive: mergedIsArchive };
          }
        }
      }
    }
  }

  // Merge classic mode progress
  const mergedRecentIds = Array.from(
    new Set([
      ...(clientProgress?.classic?.recentlyPlayedIds ?? []),
      ...(existing.classic?.recentlyPlayedIds ?? []),
    ])
  ).slice(0, 20);

  const clientClassicPoints =
    typeof clientProgress?.classic?.totalPoints === "number" && clientProgress.classic.totalPoints > 0
      ? clientProgress.classic.totalPoints
      : (clientProgress?.classic?.totalWins ?? 0) * 90;
  const existingClassicPoints =
    typeof existing.classic?.totalPoints === "number" && existing.classic.totalPoints > 0
      ? existing.classic.totalPoints
      : (existing.classic?.totalWins ?? 0) * 90;

  const clientBestTime = clientProgress?.classic?.bestSolveTimeSeconds ?? null;
  const existingBestTime = existing.classic?.bestSolveTimeSeconds ?? null;
  const mergedBestTime =
    clientBestTime !== null && existingBestTime !== null
      ? Math.min(clientBestTime, existingBestTime)
      : clientBestTime ?? existingBestTime;

  const mergedClassic = {
    recentlyPlayedIds: mergedRecentIds,
    lastDifficulty:
      clientProgress?.classic?.lastDifficulty ?? existing.classic?.lastDifficulty ?? "MEDIUM",
    totalPlayed: Math.max(
      clientProgress?.classic?.totalPlayed ?? 0,
      existing.classic?.totalPlayed ?? 0
    ),
    totalWins: Math.max(
      clientProgress?.classic?.totalWins ?? 0,
      existing.classic?.totalWins ?? 0
    ),
    totalPoints: Math.max(clientClassicPoints, existingClassicPoints),
    bestSolveTimeSeconds: mergedBestTime,
    totalElapsedSeconds: Math.max(
      clientProgress?.classic?.totalElapsedSeconds ?? 0,
      existing.classic?.totalElapsedSeconds ?? 0
    ),
  };

  const mergedProgress: StoredProgressSchema = {
    version: 1,
    daily: mergedDaily,
    classic: mergedClassic,
  };

  // Persist merged progress for this user in inMemoryDb
  inMemoryDb.saveUserProgress(userId, mergedProgress);

  // Calculate authoritative statistics
  const stats: PlayerStatistics = calculatePlayerStatistics(mergedProgress, todayStr);

  // Sync with guestProfile in DB
  const profile = inMemoryDb.getGuestProfile(userId);
  profile.currentDailyStreak = stats.daily.currentStreak;
  profile.longestDailyStreak = stats.daily.longestStreak;
  profile.classicPlayed = stats.classic.totalPlayed;
  profile.classicWins = stats.classic.totalWins;
  inMemoryDb.saveGuestProfile(profile);

  return NextResponse.json({
    status: "SYNCED",
    userId,
    progress: mergedProgress,
    stats,
  });
}

export async function GET(request: Request): Promise<NextResponse> {
  const userId = await resolveClerkUserId(request);
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized. You must be signed in to view your synced statistics." },
      { status: 401 }
    );
  }

  const todayStr = getServerDailyDateString();
  const progress = inMemoryDb.getUserProgress(userId) || INITIAL_PROGRESS_DATA;
  const stats = calculatePlayerStatistics(progress, todayStr);

  return NextResponse.json({
    status: "OK",
    userId,
    progress,
    stats,
  });
}
