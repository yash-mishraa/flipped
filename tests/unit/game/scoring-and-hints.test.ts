import { describe, it, expect } from "vitest";
import { calculateScore, SCORING_CONFIG } from "@/features/game/domain/scoring";
import { applyHintToGrid, selectNextHint } from "@/features/game/domain/hints";
import { createInitialGrid, enterLetter } from "@/features/game/domain/letter-grid";
import { TEST_PUZZLES } from "@/features/game/data/test-puzzles";

describe("Deterministic Scoring & Hint Selection Logic", () => {
  const fastFoodPuzzle = TEST_PUZZLES[0]!; // FAST (4) FOOD (4)

  describe("Scoring Engine (calculateScore)", () => {
    it("awards full 100 base score for 0 seconds elapsed and 0 hints", () => {
      expect(calculateScore(0, 0)).toBe(100);
    });

    it("evaluates canonical boundary test cases accurately", () => {
      // 4 seconds, 0 hints: floor(4/5) = 0 -> 100
      expect(calculateScore(4, 0)).toBe(100);

      // 5 seconds, 0 hints: floor(5/5) = 1 -> 99
      expect(calculateScore(5, 0)).toBe(99);

      // 10 seconds, 0 hints: floor(10/5) = 2 -> 98
      expect(calculateScore(10, 0)).toBe(98);

      // 30 seconds, 1 hint: floor(30/5) = 6, 1*5 = 5 -> 100 - 6 - 5 = 89
      expect(calculateScore(30, 1)).toBe(89);

      // 60 seconds, 0 hints: floor(60/5) = 12 -> 88
      expect(calculateScore(60, 0)).toBe(88);
    });

    it("deducts 5 points per hint used", () => {
      expect(calculateScore(0, 1)).toBe(95);
      expect(calculateScore(0, 2)).toBe(90);
      expect(calculateScore(0, 4)).toBe(80);
    });

    it("clamps minimum score to 0 points", () => {
      expect(calculateScore(600, 0)).toBe(SCORING_CONFIG.MIN_SCORE);
      expect(calculateScore(0, 25)).toBe(SCORING_CONFIG.MIN_SCORE);
      expect(calculateScore(999, 99)).toBe(SCORING_CONFIG.MIN_SCORE);
    });

    it("clamps maximum score to 100 points", () => {
      expect(calculateScore(0, 0)).toBe(SCORING_CONFIG.MAX_SCORE);
    });

    it("rejects negative elapsed time with RangeError", () => {
      expect(() => calculateScore(-1, 0)).toThrowError(RangeError);
      expect(() => calculateScore(-10, 2)).toThrowError(RangeError);
    });

    it("rejects negative hints with RangeError", () => {
      expect(() => calculateScore(10, -1)).toThrowError(RangeError);
    });

    it("rejects non-finite values (NaN, Infinity) with TypeError", () => {
      expect(() => calculateScore(NaN, 0)).toThrowError(TypeError);
      expect(() => calculateScore(Infinity, 0)).toThrowError(TypeError);
      expect(() => calculateScore(10, NaN)).toThrowError(TypeError);
      expect(() => calculateScore(10, Infinity)).toThrowError(TypeError);
    });

    it("rejects non-number argument types with TypeError", () => {
      expect(() => calculateScore("10" as unknown as number, 0)).toThrowError(TypeError);
      expect(() => calculateScore(10, "1" as unknown as number)).toThrowError(TypeError);
    });
  });

  describe("Hint Selection Engine (selectNextHint)", () => {
    it("selects first unrevealed non-fixed letter in reading order", () => {
      const grid = createInitialGrid(fastFoodPuzzle); // FAST FOOD (F fixed at 0,0 and 1,0)

      const hint1 = selectNextHint(grid, fastFoodPuzzle);
      expect(hint1.success).toBe(true);
      if (hint1.success) {
        // First eligible tile is (wordIndex 0, letterIndex 1) -> 'A' in FAST
        expect(hint1.position).toEqual({ wordIndex: 0, letterIndex: 1 });
        expect(hint1.letter).toBe("A");
      }
    });

    it("never selects a fixed clue letter", () => {
      const grid = createInitialGrid(fastFoodPuzzle);
      const hint = selectNextHint(grid, fastFoodPuzzle);
      expect(hint.success).toBe(true);
      if (hint.success) {
        expect(hint.position.letterIndex).not.toBe(0);
      }
    });

    it("skips tiles that the player has already answered correctly", () => {
      let grid = createInitialGrid(fastFoodPuzzle);
      // Player already entered correct 'A' at pos 1 and correct 'S' at pos 2
      grid = enterLetter(grid, fastFoodPuzzle, { wordIndex: 0, letterIndex: 1 }, "A");
      grid = enterLetter(grid, fastFoodPuzzle, { wordIndex: 0, letterIndex: 2 }, "S");

      const hint = selectNextHint(grid, fastFoodPuzzle);
      expect(hint.success).toBe(true);
      if (hint.success) {
        // Next eligible tile is pos 3 -> 'T' in FAST
        expect(hint.position).toEqual({ wordIndex: 0, letterIndex: 3 });
        expect(hint.letter).toBe("T");
      }
    });

    it("crosses into Word 1 when Word 0 is fully correct", () => {
      let grid = createInitialGrid(fastFoodPuzzle);
      grid = enterLetter(grid, fastFoodPuzzle, { wordIndex: 0, letterIndex: 1 }, "A");
      grid = enterLetter(grid, fastFoodPuzzle, { wordIndex: 0, letterIndex: 2 }, "S");
      grid = enterLetter(grid, fastFoodPuzzle, { wordIndex: 0, letterIndex: 3 }, "T");

      const hint = selectNextHint(grid, fastFoodPuzzle);
      expect(hint.success).toBe(true);
      if (hint.success) {
        // Should select pos 1 of Word 1 ('O' in FOOD, skipping fixed tile 0 'F')
        expect(hint.position).toEqual({ wordIndex: 1, letterIndex: 1 });
        expect(hint.letter).toBe("O");
      }
    });

    it("replaces an incorrect letter with the correct hint letter", () => {
      let grid = createInitialGrid(fastFoodPuzzle);
      // Player entered wrong letter 'Z' at pos 1
      grid = enterLetter(grid, fastFoodPuzzle, { wordIndex: 0, letterIndex: 1 }, "Z");

      const hint = selectNextHint(grid, fastFoodPuzzle);
      expect(hint.success).toBe(true);
      if (hint.success) {
        expect(hint.position).toEqual({ wordIndex: 0, letterIndex: 1 });
        expect(hint.letter).toBe("A");
      }
    });

    it("returns NO_ELIGIBLE_TILES when all letters are already solved", () => {
      let grid = createInitialGrid(fastFoodPuzzle);
      grid = enterLetter(grid, fastFoodPuzzle, { wordIndex: 0, letterIndex: 1 }, "A");
      grid = enterLetter(grid, fastFoodPuzzle, { wordIndex: 0, letterIndex: 2 }, "S");
      grid = enterLetter(grid, fastFoodPuzzle, { wordIndex: 0, letterIndex: 3 }, "T");
      grid = enterLetter(grid, fastFoodPuzzle, { wordIndex: 1, letterIndex: 1 }, "O");
      grid = enterLetter(grid, fastFoodPuzzle, { wordIndex: 1, letterIndex: 2 }, "O");
      grid = enterLetter(grid, fastFoodPuzzle, { wordIndex: 1, letterIndex: 3 }, "D");

      const hint = selectNextHint(grid, fastFoodPuzzle);
      expect(hint.success).toBe(false);
      if (!hint.success) {
        expect(hint.reason).toBe("NO_ELIGIBLE_TILES");
      }
    });

    it("applies a selected hint into the grid cleanly and confirms the tile", () => {
      const grid = createInitialGrid(fastFoodPuzzle);
      const hint = selectNextHint(grid, fastFoodPuzzle);
      expect(hint.success).toBe(true);

      if (hint.success) {
        const updated = applyHintToGrid(grid, fastFoodPuzzle, {
          position: hint.position,
          letter: hint.letter,
        });

        const targetTile = updated.words[hint.position.wordIndex][hint.position.letterIndex]!;
        expect(targetTile.letter).toBe("A");
        expect(targetTile.feedback).toBe("CONFIRMED");
      }
    });
  });
});
