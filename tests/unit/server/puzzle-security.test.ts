import { describe, it, expect } from "vitest";
import {
  createSafeGameplayPayload,
  createFinalizedResultPayload,
} from "@/server/puzzles/puzzle-repository";
import { TEST_PUZZLES } from "@/features/game/data/test-puzzles";
import type { StoredAttempt } from "@/server/db/client";

describe("Puzzle Secrecy and Security", () => {
  const fastFoodPuzzle = TEST_PUZZLES[0]!;

  const activeAttempt: StoredAttempt = {
    id: "att_active_123",
    guestId: "guest_player_1",
    mode: "DAILY",
    dailyDate: "2026-10-12",
    puzzleId: fastFoodPuzzle.id,
    status: "ACTIVE",
    startedAt: new Date(),
    deadline: new Date(Date.now() + 60_000),
    endedAt: null,
    elapsedSeconds: 0,
    hintsUsed: 0,
    finalScore: 0,
    isWon: false,
    solvedPhrase: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("strictly omits canonical answers and variants from safe gameplay payload", () => {
    const payload = createSafeGameplayPayload(fastFoodPuzzle, activeAttempt);

    // Answer words FAST and FOOD must NOT appear in payload root
    expect(payload).not.toHaveProperty("answerWords");
    expect(payload).not.toHaveProperty("approvedVariants");

    // Clue words are present
    expect(payload.clueWords).toEqual(["SLOW", "MEAL"]);

    // First letters only
    expect(payload.firstLetters).toEqual(["F", "F"]);
    expect(payload.wordLengths).toEqual([4, 4]);

    // Transformation answers and explanations must NOT be leaked
    expect(payload.transformations[0]).not.toHaveProperty("answerWord");
    expect(payload.transformations[0]).not.toHaveProperty("explanation");
    expect(payload.transformations[1]).not.toHaveProperty("answerWord");
    expect(payload.transformations[1]).not.toHaveProperty("explanation");

    // Serialized JSON check: confirm "FAST" and "FOOD" do not leak anywhere in JSON
    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain("FAST");
    expect(serialized).not.toContain("FOOD");
  });

  it("prevents creating finalized result payload for an active round", () => {
    expect(() => {
      createFinalizedResultPayload(fastFoodPuzzle, activeAttempt);
    }).toThrow(/Cannot generate finalized result for an active/i);
  });

  it("reveals canonical solution and transformation explanations only when terminal", () => {
    const finalizedAttempt: StoredAttempt = {
      ...activeAttempt,
      status: "WON",
      isWon: true,
      finalScore: 92,
      elapsedSeconds: 24,
      solvedPhrase: "FAST FOOD",
      endedAt: new Date(),
    };

    const result = createFinalizedResultPayload(fastFoodPuzzle, finalizedAttempt);

    expect(result.status).toBe("WON");
    expect(result.canonicalPhrase).toBe("FAST FOOD");
    expect(result.finalScore).toBe(92);
    expect(result.transformations[0]!.answerWord).toBe("FAST");
    expect(result.transformations[1]!.answerWord).toBe("FOOD");
  });
});
