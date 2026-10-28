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

  it("strictly avoids repeating answer words seen in recent puzzle IDs", () => {
    // Select first puzzle
    const res1 = selectClassicPuzzle("MEDIUM", { recentPuzzleIds: [] });
    expect(res1.status).toBe("SUCCESS");
    if (res1.status !== "SUCCESS") return;

    const [w1, w2] = res1.puzzle.answerWords;

    // Select next puzzle with res1 in recentPuzzleIds
    const res2 = selectClassicPuzzle("MEDIUM", {
      recentPuzzleIds: [res1.puzzle.id],
    });
    expect(res2.status).toBe("SUCCESS");
    if (res2.status !== "SUCCESS") return;

    expect(res2.puzzle.id).not.toBe(res1.puzzle.id);
    expect(res2.puzzle.answerWords).not.toContain(w1);
    expect(res2.puzzle.answerWords).not.toContain(w2);
  });

  it("never repeats any answer word across an entire sprint sequence", () => {
    const sprintRecentIds: string[] = [];
    const sprintWords = new Set<string>();

    for (let round = 0; round < 8; round++) {
      const result = selectClassicPuzzle("EASY", {
        recentPuzzleIds: sprintRecentIds,
        randomFn: () => (round * 0.1) % 1,
      });

      expect(result.status).toBe("SUCCESS");
      if (result.status === "SUCCESS") {
        const [w1, w2] = result.puzzle.answerWords;
        expect(sprintWords.has(w1)).toBe(false);
        expect(sprintWords.has(w2)).toBe(false);

        sprintWords.add(w1);
        sprintWords.add(w2);
        sprintRecentIds.unshift(result.puzzle.id);
      }
    }
  });
});
