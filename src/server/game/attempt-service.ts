import crypto from "crypto";
import { inMemoryDb, type StoredAttempt } from "../db/client";
import {
  persistAttempt,
  resolveAuthoritativeAttempt,
  ATTEMPT_COOKIE_NAME,
  verifyAttemptToken,
} from "../auth/attempt-session";
import { extractCookie } from "../auth/guest-session";
import {
  createSafeGameplayPayload,
  createFinalizedResultPayload,
  type SafeGameplayPayload,
  type FinalizedResultPayload,
  getPrivilegedPuzzleById,
  selectServerClassicPuzzle,
} from "../puzzles/puzzle-repository";
import {
  getServerDailyDateString,
  resolveServerDailyAssignment,
} from "../scheduling/daily-scheduler";
import { calculateScore } from "@/features/game/domain/scoring";
import { checkAnswer } from "@/features/game/domain/check-answer";
import { splitNormalizedPhrase } from "@/features/game/domain/normalize-answer";
import type { Difficulty, TileFeedback } from "@/features/game/domain/types";
import type { DailyAttemptRecord } from "@/features/game/modes/mode-types";

export const ROUND_DURATION_MS = 60_000;

export type StartDailyAttemptResult =
  | {
      readonly status: "STARTED";
      readonly payload: SafeGameplayPayload;
      readonly attempt?: StoredAttempt;
    }
  | {
      readonly status: "IN_PROGRESS";
      readonly payload: SafeGameplayPayload;
      readonly attempt?: StoredAttempt;
    }
  | {
      readonly status: "ALREADY_COMPLETED";
      readonly result: FinalizedResultPayload;
      readonly attempt?: StoredAttempt;
    }
  | {
      readonly status: "UNAVAILABLE";
      readonly message: string;
    };

export type StartClassicAttemptResult =
  | {
      readonly status: "STARTED";
      readonly payload: SafeGameplayPayload;
      readonly attempt?: StoredAttempt;
    }
  | {
      readonly status: "EMPTY_POOL";
      readonly message: string;
    };

export type SubmitAttemptResult =
  | {
      readonly status: "WON";
      readonly result: FinalizedResultPayload;
      readonly tileFeedback?: readonly [readonly TileFeedback[], readonly TileFeedback[]];
      readonly attempt?: StoredAttempt;
    }
  | {
      readonly status: "TIMED_OUT";
      readonly result: FinalizedResultPayload;
      readonly attempt?: StoredAttempt;
    }
  | {
      readonly status: "INCORRECT";
      readonly isMatch: false;
      readonly hintsUsed: number;
      readonly tileFeedback?: readonly [readonly TileFeedback[], readonly TileFeedback[]];
      readonly attempt?: StoredAttempt;
    }
  | {
      readonly status: "ALREADY_FINALIZED";
      readonly result: FinalizedResultPayload;
      readonly attempt?: StoredAttempt;
    }
  | {
      readonly status: "ERROR";
      readonly message: string;
    };

/**
 * Starts or recovers an authoritative Daily challenge attempt for the guest.
 * Strictly enforces single-attempt rule: multiple completed attempts on the same calendar day are rejected.
 */
export async function startDailyAttempt(
  guestId: string,
  targetDate?: string,
  request?: Request,
  clientAttempt?: DailyAttemptRecord,
  clerkUserId?: string
): Promise<StartDailyAttemptResult> {
  const dateStr = targetDate || getServerDailyDateString();
  const scheduleResult = await resolveServerDailyAssignment(dateStr);

  if (scheduleResult.status !== "AVAILABLE") {
    return {
      status: "UNAVAILABLE",
      message:
        scheduleResult.status === "FUTURE_UNPUBLISHED"
          ? scheduleResult.message
          : `No daily challenge scheduled for ${dateStr}.`,
    };
  }

  const puzzle = await getPrivilegedPuzzleById(scheduleResult.puzzleId);
  if (!puzzle) {
    return {
      status: "UNAVAILABLE",
      message: "Daily puzzle data could not be loaded.",
    };
  }

  // 1. Check existing attempt in DB for this guest on this date
  let existingAttempt = inMemoryDb.findDailyAttempt(guestId, dateStr);

  // 1b. If authenticated with Clerk, check under clerkUserId
  if (!existingAttempt && clerkUserId) {
    existingAttempt = inMemoryDb.findDailyAttempt(clerkUserId, dateStr);
    if (!existingAttempt) {
      const userProgress = inMemoryDb.getUserProgress(clerkUserId);
      const userDaily = userProgress?.daily?.[dateStr];
      if (userDaily && (userDaily.status === "WON" || userDaily.status === "TIMED_OUT")) {
        const storedFromUser: StoredAttempt = {
          id: `att_daily_${dateStr}_${puzzle.id}_user_${userDaily.completedAt || "done"}`,
          guestId: clerkUserId,
          mode: "DAILY",
          dailyDate: dateStr,
          puzzleId: puzzle.id,
          status: userDaily.status,
          startedAt: new Date(userDaily.completedAt || Date.now()),
          deadline: new Date(userDaily.completedAt || Date.now()),
          endedAt: new Date(userDaily.completedAt || Date.now()),
          elapsedSeconds: userDaily.elapsedSeconds ?? 60,
          hintsUsed: userDaily.hintsUsed ?? 0,
          finalScore: userDaily.finalScore ?? (userDaily.status === "WON" ? 100 : 0),
          isWon: userDaily.status === "WON",
          solvedPhrase: userDaily.solvedPhrase || puzzle.answerWords.join(" "),
          createdAt: new Date(userDaily.completedAt || Date.now()),
          updatedAt: new Date(userDaily.completedAt || Date.now()),
        };
        existingAttempt = persistAttempt(storedFromUser);
      }
    }
  }

  // 1c. If client passed a finalized attempt from localStorage/progress
  if (
    !existingAttempt &&
    clientAttempt &&
    clientAttempt.date === dateStr &&
    (clientAttempt.status === "WON" || clientAttempt.status === "TIMED_OUT")
  ) {
    const storedFromClient: StoredAttempt = {
      id: `att_daily_${dateStr}_${puzzle.id}_client_${clientAttempt.completedAt || "done"}`,
      guestId,
      mode: "DAILY",
      dailyDate: dateStr,
      puzzleId: puzzle.id,
      status: clientAttempt.status,
      startedAt: new Date(clientAttempt.completedAt || Date.now()),
      deadline: new Date(clientAttempt.completedAt || Date.now()),
      endedAt: new Date(clientAttempt.completedAt || Date.now()),
      elapsedSeconds: clientAttempt.elapsedSeconds ?? 60,
      hintsUsed: clientAttempt.hintsUsed ?? 0,
      finalScore: clientAttempt.finalScore ?? (clientAttempt.status === "WON" ? 100 : 0),
      isWon: clientAttempt.status === "WON",
      solvedPhrase: clientAttempt.solvedPhrase || puzzle.answerWords.join(" "),
      createdAt: new Date(clientAttempt.completedAt || Date.now()),
      updatedAt: new Date(clientAttempt.completedAt || Date.now()),
    };
    existingAttempt = persistAttempt(storedFromClient);
  }

  // 1d. If not found in memory, check request cookie
  if (!existingAttempt && request) {
    const rawToken = extractCookie(request.headers.get("cookie"), ATTEMPT_COOKIE_NAME);
    const fromCookie = verifyAttemptToken(rawToken);
    if (
      fromCookie &&
      (fromCookie.guestId === guestId || (clerkUserId && fromCookie.guestId === clerkUserId)) &&
      fromCookie.mode === "DAILY" &&
      fromCookie.dailyDate === dateStr
    ) {
      existingAttempt = persistAttempt(fromCookie);
    }
  }

  if (existingAttempt) {
    // If already finalized, return the read-only completion result
    if (existingAttempt.status === "WON" || existingAttempt.status === "TIMED_OUT") {
      return {
        status: "ALREADY_COMPLETED",
        result: createFinalizedResultPayload(puzzle, existingAttempt),
        attempt: existingAttempt,
      };
    }

    // If still active, check if authoritative deadline has passed
    const now = Date.now();
    if (now >= existingAttempt.deadline.getTime()) {
      // Deadline expired while away; finalize as TIMED_OUT atomically
      const timedOutAttempt: StoredAttempt = {
        ...existingAttempt,
        status: "TIMED_OUT",
        isWon: false,
        finalScore: 0,
        elapsedSeconds: 60,
        endedAt: new Date(existingAttempt.deadline.getTime()),
        updatedAt: new Date(),
      };
      persistAttempt(timedOutAttempt);

      return {
        status: "ALREADY_COMPLETED",
        result: createFinalizedResultPayload(puzzle, timedOutAttempt),
        attempt: timedOutAttempt,
      };
    }

    // Active round in progress; return safe resume payload
    return {
      status: "IN_PROGRESS",
      payload: createSafeGameplayPayload(puzzle, existingAttempt),
      attempt: existingAttempt,
    };
  }

  // Create brand new daily attempt with self-describing ID for serverless resilience
  const startedAt = new Date();
  const deadline = new Date(startedAt.getTime() + ROUND_DURATION_MS);
  const randSuffix = crypto.randomBytes(4).toString("hex");

  const newAttempt: StoredAttempt = {
    id: `att_daily_${dateStr}_${puzzle.id}_${startedAt.getTime()}_${randSuffix}`,
    guestId,
    mode: "DAILY",
    dailyDate: dateStr,
    puzzleId: puzzle.id,
    status: "ACTIVE",
    startedAt,
    deadline,
    endedAt: null,
    elapsedSeconds: 0,
    hintsUsed: 0,
    finalScore: 0,
    isWon: false,
    solvedPhrase: null,
    createdAt: startedAt,
    updatedAt: startedAt,
  };

  persistAttempt(newAttempt);

  return {
    status: "STARTED",
    payload: createSafeGameplayPayload(puzzle, newAttempt),
    attempt: newAttempt,
  };
}

/**
 * Starts a new Classic mode attempt for the guest with the requested difficulty.
 */
export async function startClassicAttempt(
  guestId: string,
  difficulty: Difficulty,
  recentPuzzleIds: readonly string[] = [],
  durationMs: number = 360_000
): Promise<StartClassicAttemptResult> {
  const puzzle = await selectServerClassicPuzzle(difficulty, recentPuzzleIds);

  if (!puzzle) {
    return {
      status: "EMPTY_POOL",
      message: `No puzzles available for difficulty tier "${difficulty}".`,
    };
  }

  const startedAt = new Date();
  const deadline = new Date(startedAt.getTime() + Math.max(60_000, durationMs));
  const randSuffix = crypto.randomBytes(4).toString("hex");

  const newAttempt: StoredAttempt = {
    id: `att_classic_${puzzle.id}_${startedAt.getTime()}_${randSuffix}`,
    guestId,
    mode: "CLASSIC",
    dailyDate: null,
    puzzleId: puzzle.id,
    status: "ACTIVE",
    startedAt,
    deadline,
    endedAt: null,
    elapsedSeconds: 0,
    hintsUsed: 0,
    finalScore: 0,
    isWon: false,
    solvedPhrase: null,
    createdAt: startedAt,
    updatedAt: startedAt,
  };

  persistAttempt(newAttempt);

  return {
    status: "STARTED",
    payload: createSafeGameplayPayload(puzzle, newAttempt),
    attempt: newAttempt,
  };
}

/**
 * Submits an answer attempt for authoritative evaluation.
 * Calculates elapsed time and score server-side without trusting client claims.
 */
export async function submitAuthoritativeAttempt(
  attemptId: string,
  guestId: string,
  candidatePhrase: string,
  request?: Request
): Promise<SubmitAttemptResult> {
  const attempt = await resolveAuthoritativeAttempt(attemptId, guestId, request);

  if (!attempt || attempt.guestId !== guestId) {
    return {
      status: "ERROR",
      message: "Attempt not found or access denied.",
    };
  }

  const puzzle = await getPrivilegedPuzzleById(attempt.puzzleId);
  if (!puzzle) {
    return {
      status: "ERROR",
      message: "Associated puzzle data missing.",
    };
  }

  // Idempotent check: if already finalized, return stable result
  if (attempt.status !== "ACTIVE") {
    return {
      status: "ALREADY_FINALIZED",
      result: createFinalizedResultPayload(puzzle, attempt),
      attempt,
    };
  }

  // For daily mode, strictly enforce single attempt: check if this date already has a finalized attempt
  if (attempt.mode === "DAILY" && attempt.dailyDate) {
    const existing = inMemoryDb.findDailyAttempt(guestId, attempt.dailyDate);
    if (
      existing &&
      existing.id !== attempt.id &&
      (existing.status === "WON" || existing.status === "TIMED_OUT")
    ) {
      return {
        status: "ALREADY_FINALIZED",
        result: createFinalizedResultPayload(puzzle, existing),
        attempt: existing,
      };
    }
  }

  const now = Date.now();
  const deadlineMs = attempt.deadline.getTime();

  // Authoritative deadline check: requests received at or after deadline cannot win
  if (now >= deadlineMs) {
    const timedOutAttempt: StoredAttempt = {
      ...attempt,
      status: "TIMED_OUT",
      isWon: false,
      finalScore: 0,
      elapsedSeconds: 60,
      endedAt: new Date(deadlineMs),
      updatedAt: new Date(),
    };
    persistAttempt(timedOutAttempt);

    return {
      status: "TIMED_OUT",
      result: createFinalizedResultPayload(puzzle, timedOutAttempt),
      attempt: timedOutAttempt,
    };
  }

  // Evaluate candidate answer using server-side canonical rules
  const words = splitNormalizedPhrase(candidatePhrase);
  const checkResult = words ? checkAnswer(puzzle, words[0], words[1]) : { isMatch: false };

  const target0 = puzzle.answerWords[0] || "";
  const target1 = puzzle.answerWords[1] || "";
  const cand0 = words?.[0] || "";
  const cand1 = words?.[1] || "";

  const feedback0: TileFeedback[] = Array.from({ length: target0.length }, (_, i) => {
    if (i === 0) return "CONFIRMED";
    const char = cand0[i]?.toUpperCase();
    if (!char || char === " ") return "NONE";
    return char === target0[i]?.toUpperCase() ? "CONFIRMED" : "ELIMINATED";
  });

  const feedback1: TileFeedback[] = Array.from({ length: target1.length }, (_, i) => {
    if (i === 0) return "CONFIRMED";
    const char = cand1[i]?.toUpperCase();
    if (!char || char === " ") return "NONE";
    return char === target1[i]?.toUpperCase() ? "CONFIRMED" : "ELIMINATED";
  });

  if (!checkResult.isMatch) {
    return {
      status: "INCORRECT",
      isMatch: false,
      hintsUsed: attempt.hintsUsed,
      tileFeedback: [feedback0, feedback1],
      attempt,
    };
  }

  // Solution is correct and before deadline!
  const elapsedMs = Math.max(0, now - attempt.startedAt.getTime());
  const elapsedSeconds = Math.min(60, Math.max(0, Math.floor(elapsedMs / 1000)));
  const finalScore = calculateScore(elapsedSeconds, attempt.hintsUsed);

  const wonAttempt: StoredAttempt = {
    ...attempt,
    status: "WON",
    isWon: true,
    finalScore,
    elapsedSeconds,
    solvedPhrase: candidatePhrase.toUpperCase().trim(),
    endedAt: new Date(now),
    updatedAt: new Date(),
  };

  persistAttempt(wonAttempt);

  // Update guest streaks/stats
  const profile = inMemoryDb.getGuestProfile(guestId);
  if (attempt.mode === "DAILY") {
    const isToday = attempt.dailyDate === getServerDailyDateString();
    if (isToday) {
      const newStreak = profile.currentDailyStreak + 1;
      inMemoryDb.saveGuestProfile({
        ...profile,
        currentDailyStreak: newStreak,
        longestDailyStreak: Math.max(profile.longestDailyStreak, newStreak),
        lastDailyDate: attempt.dailyDate,
      });
    } else {
      // Past daily challenge: do NOT increase daily streak
      inMemoryDb.saveGuestProfile({
        ...profile,
      });
    }
  } else {
    inMemoryDb.saveGuestProfile({
      ...profile,
      classicPlayed: profile.classicPlayed + 1,
      classicWins: profile.classicWins + 1,
    });
  }

  const wonFeedback0: TileFeedback[] = Array.from({ length: target0.length }, () => "CONFIRMED");
  const wonFeedback1: TileFeedback[] = Array.from({ length: target1.length }, () => "CONFIRMED");

  return {
    status: "WON",
    result: createFinalizedResultPayload(puzzle, wonAttempt),
    tileFeedback: [wonFeedback0, wonFeedback1],
    attempt: wonAttempt,
  };
}

/**
 * Authoritatively finalizes an attempt as timed out when 60 seconds have elapsed.
 */
export async function finalizeAuthoritativeTimeout(
  attemptId: string,
  guestId: string,
  request?: Request
): Promise<{ success: boolean; result?: FinalizedResultPayload; message?: string; attempt?: StoredAttempt }> {
  const attempt = await resolveAuthoritativeAttempt(attemptId, guestId, request);

  if (!attempt || attempt.guestId !== guestId) {
    return {
      success: false,
      message: "Attempt not found or unauthorized.",
    };
  }

  const puzzle = await getPrivilegedPuzzleById(attempt.puzzleId);
  if (!puzzle) {
    return {
      success: false,
      message: "Puzzle data missing.",
    };
  }

  // If already finalized, return existing result idempotently
  if (attempt.status !== "ACTIVE") {
    return {
      success: true,
      result: createFinalizedResultPayload(puzzle, attempt),
      attempt,
    };
  }

  const timedOutAttempt: StoredAttempt = {
    ...attempt,
    status: "TIMED_OUT",
    isWon: false,
    finalScore: 0,
    elapsedSeconds: 60,
    endedAt: new Date(),
    updatedAt: new Date(),
  };

  persistAttempt(timedOutAttempt);

  // Update profile counters
  const profile = inMemoryDb.getGuestProfile(guestId);
  if (attempt.mode === "DAILY") {
    inMemoryDb.saveGuestProfile({
      ...profile,
      currentDailyStreak: 0, // Reset streak on daily timeout
      lastDailyDate: attempt.dailyDate,
    });
  } else {
    inMemoryDb.saveGuestProfile({
      ...profile,
      classicPlayed: profile.classicPlayed + 1,
    });
  }

  return {
    success: true,
    result: createFinalizedResultPayload(puzzle, timedOutAttempt),
    attempt: timedOutAttempt,
  };
}

/**
 * Fetches an attempt result safely. If active, rejects to protect answers.
 */
export async function getAttemptResultSafe(
  attemptId: string,
  guestId: string,
  request?: Request
): Promise<{ success: boolean; result?: FinalizedResultPayload; message?: string }> {
  const attempt = await resolveAuthoritativeAttempt(attemptId, guestId, request);

  if (!attempt || attempt.guestId !== guestId) {
    return {
      success: false,
      message: "Attempt not found or access denied.",
    };
  }

  if (attempt.status === "ACTIVE") {
    return {
      success: false,
      message: "Cannot inspect results of an active attempt.",
    };
  }

  const puzzle = await getPrivilegedPuzzleById(attempt.puzzleId);
  if (!puzzle) {
    return {
      success: false,
      message: "Puzzle data missing.",
    };
  }

  return {
    success: true,
    result: createFinalizedResultPayload(puzzle, attempt),
  };
}
