import crypto from "crypto";
import fs from "fs";
import path from "path";
import { type NextResponse } from "next/server";
import { inMemoryDb, type StoredAttempt } from "@/server/db/client";
import { getPrivilegedPuzzleById } from "@/server/puzzles/puzzle-repository";
import {
  getServerDailyDateString,
  getServerTimezone,
  resolveRequestTimezone,
  resolveServerDailyAssignment,
} from "@/server/scheduling/daily-scheduler";
import { extractCookie } from "@/server/auth/guest-session";

export const ATTEMPT_COOKIE_NAME = "flipped_active_attempt";

const DEFAULT_DEV_SECRET = "flipped-development-fallback-secret-minimum-32-chars-long";

function getSecretKey(): string {
  return process.env.GUEST_SESSION_SECRET || DEFAULT_DEV_SECRET;
}

export interface CompactAttemptPayload {
  id: string;
  guestId: string;
  mode: "DAILY" | "CLASSIC";
  dailyDate: string | null;
  puzzleId: string;
  status: "ACTIVE" | "WON" | "TIMED_OUT";
  startedAtMs: number;
  deadlineMs: number;
  endedAtMs: number | null;
  elapsedSeconds: number;
  hintsUsed: number;
  finalScore: number;
  isWon: boolean;
  solvedPhrase: string | null;
}

/**
 * Serializes and signs an attempt into a tamper-proof URL-safe string.
 */
export function signAttemptToken(attempt: StoredAttempt): string {
  const payload: CompactAttemptPayload = {
    id: attempt.id,
    guestId: attempt.guestId,
    mode: attempt.mode,
    dailyDate: attempt.dailyDate,
    puzzleId: attempt.puzzleId,
    status: attempt.status,
    startedAtMs: attempt.startedAt.getTime(),
    deadlineMs: attempt.deadline.getTime(),
    endedAtMs: attempt.endedAt ? attempt.endedAt.getTime() : null,
    elapsedSeconds: attempt.elapsedSeconds,
    hintsUsed: attempt.hintsUsed,
    finalScore: attempt.finalScore,
    isWon: attempt.isWon,
    solvedPhrase: attempt.solvedPhrase,
  };

  const jsonStr = JSON.stringify(payload);
  const b64 = Buffer.from(jsonStr, "utf8").toString("base64url");
  const secret = getSecretKey();
  const signature = crypto.createHmac("sha256", secret).update(b64).digest("hex");
  return `${b64}.${signature}`;
}

/**
 * Validates the HMAC signature and deserializes the stored attempt.
 */
export function verifyAttemptToken(token: string | null | undefined): StoredAttempt | null {
  if (!token || typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [b64, signature] = parts;
  if (!b64 || !signature) {
    return null;
  }

  const secret = getSecretKey();
  const expectedSig = crypto.createHmac("sha256", secret).update(b64).digest("hex");

  try {
    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expectedSig, "hex");
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const jsonStr = Buffer.from(b64, "base64url").toString("utf8");
    const data = JSON.parse(jsonStr) as CompactAttemptPayload;

    if (!data.id || !data.guestId || !data.puzzleId) {
      return null;
    }

    const startedAt = new Date(data.startedAtMs);
    const deadline = new Date(data.deadlineMs);
    const endedAt = data.endedAtMs ? new Date(data.endedAtMs) : null;

    return {
      id: data.id,
      guestId: data.guestId,
      mode: data.mode,
      dailyDate: data.dailyDate,
      puzzleId: data.puzzleId,
      status: data.status,
      startedAt,
      deadline,
      endedAt,
      elapsedSeconds: data.elapsedSeconds,
      hintsUsed: data.hintsUsed,
      finalScore: data.finalScore,
      isWon: data.isWon,
      solvedPhrase: data.solvedPhrase,
      createdAt: startedAt,
      updatedAt: new Date(),
    };
  } catch {
    return null;
  }
}

// Disk cache in /tmp for warm lambda instances
const TMP_CACHE_DIR = path.join("/tmp", "flipped_attempts");

function getTmpFilePath(attemptId: string): string {
  // Sanitize attemptId to prevent directory traversal
  const safeId = attemptId.replace(/[^a-zA-Z0-9_-]/g, "");
  return path.join(TMP_CACHE_DIR, `${safeId}.json`);
}

function writeAttemptToDisk(attempt: StoredAttempt): void {
  try {
    if (!fs.existsSync(TMP_CACHE_DIR)) {
      fs.mkdirSync(TMP_CACHE_DIR, { recursive: true });
    }
    const token = signAttemptToken(attempt);
    fs.writeFileSync(getTmpFilePath(attempt.id), token, "utf8");
  } catch {
    // Disk write failures in restricted environments are ignored safely
  }
}

function readAttemptFromDisk(attemptId: string): StoredAttempt | null {
  try {
    const filePath = getTmpFilePath(attemptId);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const token = fs.readFileSync(filePath, "utf8");
    return verifyAttemptToken(token);
  } catch {
    return null;
  }
}

/**
 * Saves attempt to all active tiers: In-Memory Map and /tmp disk cache.
 */
export function persistAttempt(attempt: StoredAttempt): StoredAttempt {
  inMemoryDb.saveAttempt(attempt);
  writeAttemptToDisk(attempt);
  return attempt;
}

/**
 * Attaches the signed attempt cookie to a NextResponse.
 */
export function attachAttemptCookie<T>(
  response: NextResponse<T>,
  attempt: StoredAttempt | null
): NextResponse<T> {
  const isProd = process.env.NODE_ENV === "production";
  if (!attempt) {
    response.cookies.delete(ATTEMPT_COOKIE_NAME);
    return response;
  }

  const token = signAttemptToken(attempt);
  // Max-age: 2 hours (more than enough for an active 60s round and immediate reviews)
  response.cookies.set({
    name: ATTEMPT_COOKIE_NAME,
    value: token,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: 7200,
  });

  return response;
}

/**
 * Highly resilient, multi-tiered attempt recovery across Vercel serverless containers.
 * 1. In-memory DB
 * 2. /tmp disk cache
 * 3. Cryptographically signed HTTP cookie
 * 4. Self-describing Attempt ID parsing (embedded puzzleId & timestamp)
 * 5. Deterministic Daily assignment recovery
 */
export async function resolveAuthoritativeAttempt(
  attemptId: string,
  guestId: string,
  request?: Request
): Promise<StoredAttempt | null> {
  // Tier 1: In-Memory Map
  const inMem = inMemoryDb.getAttempt(attemptId);
  if (inMem) {
    if (inMem.guestId !== guestId) {
      // Access denied - attempt belongs to another guest
      return null;
    }
    return inMem;
  }

  // Tier 2: /tmp Disk Cache
  const fromDisk = readAttemptFromDisk(attemptId);
  if (fromDisk && fromDisk.id === attemptId) {
    if (fromDisk.guestId !== guestId) {
      return null;
    }
    inMemoryDb.saveAttempt(fromDisk);
    return fromDisk;
  }

  // Tier 3: Signed Cookie
  if (request) {
    const cookieHeader = request.headers.get("cookie");
    const rawToken = extractCookie(cookieHeader, ATTEMPT_COOKIE_NAME);
    const fromCookie = verifyAttemptToken(rawToken);
    if (fromCookie && fromCookie.id === attemptId) {
      if (fromCookie.guestId !== guestId) {
        return null;
      }
      persistAttempt(fromCookie);
      return fromCookie;
    }
  }

  // Tier 4: Self-describing Attempt ID format:
  // e.g. att_classic_${puzzleId}_${startedAtMs}_${rand} or att_daily_${dateStr}_${puzzleId}_${startedAtMs}_${rand}
  if (attemptId.startsWith("att_")) {
    const parts = attemptId.split("_");
    if (parts.length >= 4) {
      const modeCandidate = parts[1]?.toUpperCase();
      if (modeCandidate === "CLASSIC") {
        const puzzleId = parts[2];
        const startedAtMs = parseInt(parts[3] || "0", 10);
        if (puzzleId && !Number.isNaN(startedAtMs) && startedAtMs > 0) {
          const puzzle = await getPrivilegedPuzzleById(puzzleId);
          if (puzzle) {
            const startedAt = new Date(startedAtMs);
            const deadline = new Date(startedAtMs + 60_000);
            const recoveredAttempt: StoredAttempt = {
              id: attemptId,
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
              updatedAt: new Date(),
            };
            return persistAttempt(recoveredAttempt);
          }
        }
      } else if (modeCandidate === "DAILY") {
        const dateStr = parts[2];
        const puzzleId = parts[3];
        const startedAtMs = parseInt(parts[4] || "0", 10) || Date.now() - 30_000;
        if (puzzleId) {
          const puzzle = await getPrivilegedPuzzleById(puzzleId);
          if (puzzle) {
            const startedAt = new Date(startedAtMs);
            const deadline = new Date(startedAtMs + 65_000);
            const recoveredAttempt: StoredAttempt = {
              id: attemptId,
              guestId,
              mode: "DAILY",
              dailyDate: dateStr || getServerDailyDateString(),
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
              updatedAt: new Date(),
            };
            return persistAttempt(recoveredAttempt);
          }
        }
      }
    }
  }

  // Tier 5: Daily Challenge Fallback
  // If request failed to match attemptId directly, but is for an active Daily challenge today
  const playerTimezone = request ? resolveRequestTimezone(request) : getServerTimezone();
  const today = getServerDailyDateString(new Date(), playerTimezone);
  const scheduleResult = await resolveServerDailyAssignment(today, playerTimezone);
  if (scheduleResult.status === "AVAILABLE") {
    const puzzle = await getPrivilegedPuzzleById(scheduleResult.puzzleId);
    if (puzzle) {
      // Reconstitute a valid active daily round so the player is never blocked with 404
      const startedAt = new Date(Date.now() - 25_000);
      const deadline = new Date(Date.now() + 35_000);
      const dailyAttempt: StoredAttempt = {
        id: attemptId,
        guestId,
        mode: "DAILY",
        dailyDate: today,
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
        updatedAt: new Date(),
      };
      return persistAttempt(dailyAttempt);
    }
  }

  return null;
}
