import { describe, it, expect } from "vitest";
import {
  PUBLIC_PUZZLE_METADATA,
  PUBLIC_PUZZLES_BY_ID,
  getPuzzleCountsByDifficulty,
} from "@/features/game/data/public-puzzles";
import { getDailyScheduleStatus } from "@/features/game/modes/daily-scheduler";
import { CURATED_PUZZLES } from "@/features/game/data/puzzles";
import { createSafeGameplayPayload } from "@/server/puzzles/puzzle-repository";
import type { StoredAttempt } from "@/server/db/client";

describe("Security Audit — Answer Confidentiality & Bundle Leakage", () => {
  it("ensures public puzzle metadata strictly omits answer words, variants, and transformation targets", () => {
    expect(PUBLIC_PUZZLE_METADATA.length).toBe(CURATED_PUZZLES.length);

    for (const meta of PUBLIC_PUZZLE_METADATA) {
      // Must include safe clues and lengths
      expect(meta.id).toBeDefined();
      expect(meta.clueWords).toHaveLength(2);
      expect(meta.wordLengths).toHaveLength(2);
      expect(["EASY", "MEDIUM", "HARD"]).toContain(meta.difficulty);

      // MUST NOT contain answers
      expect((meta as unknown as Record<string, unknown>).answerWords).toBeUndefined();
      expect((meta as unknown as Record<string, unknown>).approvedVariants).toBeUndefined();
      expect((meta as unknown as Record<string, unknown>).transformations).toBeUndefined();
    }
  });

  it("ensures PUBLIC_PUZZLES_BY_ID provides safe metadata for all curated puzzles", () => {
    for (const puzzle of CURATED_PUZZLES) {
      const publicInfo = PUBLIC_PUZZLES_BY_ID.get(puzzle.id);
      expect(publicInfo).toBeDefined();
      expect(publicInfo?.clueWords).toEqual(puzzle.clueWords);
      expect(publicInfo?.difficulty).toBe(puzzle.difficulty);
      expect((publicInfo as unknown as Record<string, unknown>)?.answerWords).toBeUndefined();
    }
  });

  it("ensures getPuzzleCountsByDifficulty returns counts matching the master bank without leaking answers", () => {
    const counts = getPuzzleCountsByDifficulty();
    expect(counts.EASY).toBe(CURATED_PUZZLES.filter((p) => p.difficulty === "EASY").length);
    expect(counts.MEDIUM).toBe(CURATED_PUZZLES.filter((p) => p.difficulty === "MEDIUM").length);
    expect(counts.HARD).toBe(CURATED_PUZZLES.filter((p) => p.difficulty === "HARD").length);
  });

  it("ensures getDailyScheduleStatus returns publication status without loading puzzle solution", () => {
    const todayStatus = getDailyScheduleStatus("2026-10-12", "2026-10-14");
    expect(todayStatus).toBe("AVAILABLE");

    // Far-future date is always FUTURE_UNPUBLISHED (auto-scheduled but date > today)
    const futureStatus = getDailyScheduleStatus("2099-06-15", "2026-10-14");
    expect(futureStatus).toBe("FUTURE_UNPUBLISHED");

    // Date before the game existed returns UNAVAILABLE
    const unassignedStatus = getDailyScheduleStatus("2020-01-01", "2026-10-14");
    expect(unassignedStatus).toBe("UNAVAILABLE");
  });

  it("ensures SafeGameplayPayload sent to browser omits answerWords and transformation explanations", () => {
    const samplePuzzle = CURATED_PUZZLES[0]!;
    const mockAttempt: StoredAttempt = {
      id: "test-att-001",
      guestId: "guest-001",
      puzzleId: samplePuzzle.id,
      mode: "DAILY",
      dailyDate: "2026-10-12",
      status: "ACTIVE",
      isWon: false,
      finalScore: 0,
      elapsedSeconds: 0,
      hintsUsed: 0,
      startedAt: new Date(),
      deadline: new Date(Date.now() + 60_000),
      endedAt: null,
      solvedPhrase: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const payload = createSafeGameplayPayload(samplePuzzle, mockAttempt);

    // Verify safe fields present
    expect(payload.attemptId).toBe("test-att-001");
    expect(payload.clueWords).toEqual(samplePuzzle.clueWords);
    expect(payload.firstLetters).toEqual([
      samplePuzzle.answerWords[0][0],
      samplePuzzle.answerWords[1][0],
    ]);

    // Verify confidential fields strictly omitted
    expect((payload as unknown as Record<string, unknown>).answerWords).toBeUndefined();
    expect((payload as unknown as Record<string, unknown>).approvedVariants).toBeUndefined();

    // Verify transformations only contain clueWord and relationship, NOT answerWord or explanation
    for (const t of payload.transformations) {
      expect((t as unknown as Record<string, unknown>).answerWord).toBeUndefined();
      expect((t as unknown as Record<string, unknown>).explanation).toBeUndefined();
      expect(t.clueWord).toBeDefined();
      expect(["SYNONYM", "ANTONYM"]).toContain(t.relationship);
    }
  });
});
