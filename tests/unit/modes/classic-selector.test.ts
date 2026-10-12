import { describe, it, expect } from "vitest";
import { selectClassicPuzzle } from "@/features/game/modes/classic-selector";
import { CURATED_PUZZLES } from "@/features/game/data/puzzles";
import type { Difficulty } from "@/features/game/domain/types";

describe("Classic Puzzle Selector", () => {
  const tiers: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

  it.each(tiers)("selects a puzzle strictly matching requested tier %s", (difficulty) => {
    const result = selectClassicPuzzle(difficulty);
    expect(result.status).toBe("SUCCESS");
    if (result.status === "SUCCESS") {
      expect(result.puzzle.difficulty).toBe(difficulty);
    }
  });

  it("avoids recently played puzzle IDs when unplayed puzzles remain", () => {
    const easyPuzzles = CURATED_PUZZLES.filter((p) => p.difficulty === "EASY");
    expect(easyPuzzles.length).toBeGreaterThan(1);

    const firstEasyId = easyPuzzles[0]!.id;
    const result = selectClassicPuzzle("EASY", {
      recentPuzzleIds: [firstEasyId],
      randomFn: () => 0,
    });

    expect(result.status).toBe("SUCCESS");
    if (result.status === "SUCCESS") {
      expect(result.puzzle.id).not.toBe(firstEasyId);
      expect(result.puzzle.difficulty).toBe("EASY");
    }
  });

  it("gracefully falls back when all puzzles in the difficulty have been recently played", () => {
    const easyPuzzles = CURATED_PUZZLES.filter((p) => p.difficulty === "EASY");
    const allEasyIds = easyPuzzles.map((p) => p.id);

    // Pass all easy IDs as recent; the most recent is the first element
    const mostRecentId = allEasyIds[0]!;
    const result = selectClassicPuzzle("EASY", {
      recentPuzzleIds: allEasyIds,
      randomFn: () => 0,
    });

    expect(result.status).toBe("SUCCESS");
    if (result.status === "SUCCESS") {
      expect(result.puzzle.difficulty).toBe("EASY");
      // Fallback pool should avoid the immediate most recent puzzle if other options exist
      if (easyPuzzles.length > 1) {
        expect(result.puzzle.id).not.toBe(mostRecentId);
      }
    }
  });

  it("uses custom randomFn deterministically", () => {
    const result1 = selectClassicPuzzle("EASY", {
      recentPuzzleIds: [],
      randomFn: () => 0,
    });

    const result2 = selectClassicPuzzle("EASY", {
      recentPuzzleIds: [],
      randomFn: () => 0,
    });

    expect(result1.status).toBe("SUCCESS");
    expect(result2.status).toBe("SUCCESS");
    if (result1.status === "SUCCESS" && result2.status === "SUCCESS") {
      expect(result1.puzzle.id).toBe(result2.puzzle.id);
    }
  });
});
