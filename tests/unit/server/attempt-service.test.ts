import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  startDailyAttempt,
  startClassicAttempt,
  submitAuthoritativeAttempt,
  finalizeAuthoritativeTimeout,
} from "@/server/game/attempt-service";
import { processAuthoritativeHint } from "@/server/game/hint-service";
import { inMemoryDb } from "@/server/db/client";
import { getPrivilegedPuzzleById } from "@/server/puzzles/puzzle-repository";

describe("Authoritative Attempt Lifecycle Service", () => {
  const guestA = "guest_player_alpha";
  const guestB = "guest_player_beta";

  beforeEach(() => {
    inMemoryDb.clearAttempts();
    inMemoryDb.seedDefaultData();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Daily Attempt Lifecycle & Single Attempt Enforcement", () => {
    it("creates an active Daily attempt with safe payload and deadline", async () => {
      const outcome = await startDailyAttempt(guestA, "2026-10-12");
      expect(outcome.status).toBe("STARTED");
      if (outcome.status === "STARTED") {
        expect(outcome.payload.mode).toBe("DAILY");
        expect(outcome.payload.puzzleId).toBe("bitter-truth");
        expect(outcome.payload.hintsUsed).toBe(0);
        expect(new Date(outcome.payload.deadline).getTime()).toBeGreaterThan(Date.now());
      }
    });

    it("resumes in-progress attempt if called while round is active", async () => {
      const start1 = await startDailyAttempt(guestA, "2026-10-12");
      expect(start1.status).toBe("STARTED");

      const start2 = await startDailyAttempt(guestA, "2026-10-12");
      expect(start2.status).toBe("IN_PROGRESS");
      if (start1.status === "STARTED" && start2.status === "IN_PROGRESS") {
        expect(start2.payload.attemptId).toBe(start1.payload.attemptId);
      }
    });

    it("rejects restarting when player already completed today's challenge", async () => {
      const start = await startDailyAttempt(guestA, "2026-10-12");
      expect(start.status).toBe("STARTED");
      if (start.status !== "STARTED") return;

      // Submit winning phrase
      const submit = await submitAuthoritativeAttempt(
        start.payload.attemptId,
        guestA,
        "BITTER TRUTH"
      );
      expect(submit.status).toBe("WON");

      // Attempting to start again returns ALREADY_COMPLETED with finalized result
      const secondStart = await startDailyAttempt(guestA, "2026-10-12");
      expect(secondStart.status).toBe("ALREADY_COMPLETED");
      if (secondStart.status === "ALREADY_COMPLETED") {
        expect(secondStart.result.status).toBe("WON");
        expect(secondStart.result.canonicalPhrase).toBe("BITTER TRUTH");
      }
    });
  });

  describe("Classic Attempt Lifecycle", () => {
    it("starts a classic attempt for requested difficulty tier", async () => {
      const outcome = await startClassicAttempt(guestA, "EASY");
      expect(outcome.status).toBe("STARTED");
      if (outcome.status === "STARTED") {
        expect(outcome.payload.mode).toBe("CLASSIC");
        expect(outcome.payload.difficulty).toBe("EASY");
      }
    });
  });

  describe("Authoritative Evaluation & Deadline Enforcement", () => {
    it("awards victory when submitted before deadline and calculates score server-side", async () => {
      vi.useFakeTimers();
      const startTime = new Date("2026-10-12T10:00:00Z");
      vi.setSystemTime(startTime);

      const start = await startDailyAttempt(guestA, "2026-10-12");
      if (start.status !== "STARTED") throw new Error("Expected started");

      // Advance time by 20 seconds
      vi.advanceTimersByTime(20_000);

      const submit = await submitAuthoritativeAttempt(
        start.payload.attemptId,
        guestA,
        "BITTER TRUTH"
      );

      expect(submit.status).toBe("WON");
      if (submit.status === "WON") {
        expect(submit.result.isWon).toBe(true);
        expect(submit.result.elapsedSeconds).toBe(20);
        // Base 100 - floor(20/5) = 100 - 4 = 96 pts
        expect(submit.result.finalScore).toBe(96);
        expect(submit.result.hintsUsed).toBe(0);
      }
    });

    it("rejects victory if submitted at or after the authoritative deadline", async () => {
      vi.useFakeTimers();
      const startTime = new Date("2026-10-12T10:00:00Z");
      vi.setSystemTime(startTime);

      const start = await startDailyAttempt(guestA, "2026-10-12");
      if (start.status !== "STARTED") throw new Error("Expected started");

      // Advance time past the 60s deadline
      vi.advanceTimersByTime(60_500);

      // Attempt submit with correct phrase after expiration
      const submit = await submitAuthoritativeAttempt(
        start.payload.attemptId,
        guestA,
        "BITTER TRUTH"
      );

      // Must be finalized as TIMED_OUT with 0 score
      expect(submit.status).toBe("TIMED_OUT");
      if (submit.status === "TIMED_OUT") {
        expect(submit.result.isWon).toBe(false);
        expect(submit.result.finalScore).toBe(0);
      }
    });

    it("rejects cross-player submission attempts", async () => {
      const start = await startDailyAttempt(guestA, "2026-10-12");
      if (start.status !== "STARTED") throw new Error("Expected started");

      const submit = await submitAuthoritativeAttempt(
        start.payload.attemptId,
        guestB, // Player B trying to submit Player A's attempt
        "BITTER TRUTH"
      );

      expect(submit.status).toBe("ERROR");
      if (submit.status === "ERROR") {
        expect(submit.message).toContain("access denied");
      }
    });

    it("is idempotent on repeated submit calls", async () => {
      const start = await startDailyAttempt(guestA, "2026-10-12");
      if (start.status !== "STARTED") throw new Error("Expected started");

      const submit1 = await submitAuthoritativeAttempt(
        start.payload.attemptId,
        guestA,
        "BITTER TRUTH"
      );
      expect(submit1.status).toBe("WON");

      const submit2 = await submitAuthoritativeAttempt(
        start.payload.attemptId,
        guestA,
        "BITTER TRUTH"
      );
      expect(submit2.status).toBe("ALREADY_FINALIZED");
      if (submit1.status === "WON" && submit2.status === "ALREADY_FINALIZED") {
        expect(submit2.result.finalScore).toBe(submit1.result.finalScore);
      }
    });

    it("finalizes timeout atomically", async () => {
      const start = await startDailyAttempt(guestA, "2026-10-12");
      if (start.status !== "STARTED") throw new Error("Expected started");

      const timeout = await finalizeAuthoritativeTimeout(start.payload.attemptId, guestA);
      expect(timeout.success).toBe(true);
      expect(timeout.result?.status).toBe("TIMED_OUT");
      expect(timeout.result?.finalScore).toBe(0);
    });
  });

  describe("Server-Side Hint Authority", () => {
    it("increments hint count and reveals authorized letter without leaking full answer", async () => {
      const start = await startDailyAttempt(guestA, "2026-10-12");
      if (start.status !== "STARTED") throw new Error("Expected started");

      const attempt = inMemoryDb.getAttempt(start.payload.attemptId)!;
      const puzzle = (await getPrivilegedPuzzleById(attempt.puzzleId))!;

      const hint1 = await processAuthoritativeHint(attempt, puzzle);
      expect(hint1.success).toBe(true);
      expect(hint1.hintsUsed).toBe(1);
      expect(hint1.wordIndex).toBe(0);
      expect(hint1.letterIndex).toBe(1); // Letter 1 of Word 0
      expect(hint1.letter).toBe("I"); // B I T T E R

      // Fetch updated attempt
      const updatedAttempt = inMemoryDb.getAttempt(start.payload.attemptId)!;
      expect(updatedAttempt.hintsUsed).toBe(1);
    });
  });
});
