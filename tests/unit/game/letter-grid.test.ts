import { describe, it, expect } from "vitest";
import {
  clearTile,
  createInitialGrid,
  enterLetter,
  getFirstEditablePosition,
  getNextEditablePosition,
  getPhraseString,
  getPreviousEditablePosition,
  getWordString,
  isGridFilled,
  resetGrid,
} from "@/features/game/domain/letter-grid";
import { TEST_PUZZLES } from "@/features/game/data/test-puzzles";

describe("Letter Grid State Engine", () => {
  const fastFoodPuzzle = TEST_PUZZLES[0]!; // FAST (4) FOOD (4)

  it("creates initial grid with first letters fixed and revealed", () => {
    const grid = createInitialGrid(fastFoodPuzzle);

    // Two words
    expect(grid.words).toHaveLength(2);
    expect(grid.words[0]).toHaveLength(4);
    expect(grid.words[1]).toHaveLength(4);

    // First tile of Word 0 is fixed 'F'
    const tile0 = grid.words[0][0]!;
    expect(tile0.isFixed).toBe(true);
    expect(tile0.letter).toBe("F");
    expect(tile0.feedback).toBe("CONFIRMED");

    // First tile of Word 1 is fixed 'F'
    const tile1 = grid.words[1][0]!;
    expect(tile1.isFixed).toBe(true);
    expect(tile1.letter).toBe("F");
    expect(tile1.feedback).toBe("CONFIRMED");

    // Subsequent tiles are empty and editable
    for (let i = 1; i < 4; i++) {
      const t0 = grid.words[0][i]!;
      expect(t0.isFixed).toBe(false);
      expect(t0.letter).toBe("");
      expect(t0.feedback).toBe("NONE");

      const t1 = grid.words[1][i]!;
      expect(t1.isFixed).toBe(false);
      expect(t1.letter).toBe("");
      expect(t1.feedback).toBe("NONE");
    }
  });

  it("enters a letter into an editable tile and re-evaluates feedback", () => {
    const grid = createInitialGrid(fastFoodPuzzle);
    const updated = enterLetter(grid, fastFoodPuzzle, { wordIndex: 0, letterIndex: 1 }, "A");

    const tile = updated.words[0][1]!;
    expect(tile.letter).toBe("A");
    expect(tile.isEntered).toBe(true);
    expect(tile.feedback).toBe("CONFIRMED");
  });

  it("replaces an existing entered letter and updates feedback", () => {
    const grid = createInitialGrid(fastFoodPuzzle);
    // Enter wrong letter 'Z'
    const withZ = enterLetter(grid, fastFoodPuzzle, { wordIndex: 0, letterIndex: 1 }, "Z");
    expect(withZ.words[0][1]?.feedback).toBe("ELIMINATED");

    // Replace with correct letter 'A'
    const withA = enterLetter(withZ, fastFoodPuzzle, { wordIndex: 0, letterIndex: 1 }, "A");
    expect(withA.words[0][1]?.letter).toBe("A");
    expect(withA.words[0][1]?.feedback).toBe("CONFIRMED");
  });

  it("strictly rejects edits to fixed clue tiles", () => {
    const grid = createInitialGrid(fastFoodPuzzle);
    const attempt = enterLetter(grid, fastFoodPuzzle, { wordIndex: 0, letterIndex: 0 }, "Z");

    // Must remain 'F' and unchanged
    expect(attempt.words[0][0]?.letter).toBe("F");
    expect(attempt.words[0][0]?.feedback).toBe("CONFIRMED");
    expect(attempt).toBe(grid); // Reference preserved on rejected no-op
  });

  it("clears an editable tile and re-evaluates word feedback", () => {
    const grid = createInitialGrid(fastFoodPuzzle);
    const filled = enterLetter(grid, fastFoodPuzzle, { wordIndex: 0, letterIndex: 1 }, "A");
    expect(filled.words[0][1]?.letter).toBe("A");

    const cleared = clearTile(filled, fastFoodPuzzle, { wordIndex: 0, letterIndex: 1 });
    expect(cleared.words[0][1]?.letter).toBe("");
    expect(cleared.words[0][1]?.isEntered).toBe(false);
    expect(cleared.words[0][1]?.feedback).toBe("NONE");
  });

  it("strictly rejects clearing a fixed clue tile", () => {
    const grid = createInitialGrid(fastFoodPuzzle);
    const attempt = clearTile(grid, fastFoodPuzzle, { wordIndex: 0, letterIndex: 0 });

    expect(attempt.words[0][0]?.letter).toBe("F");
    expect(attempt).toBe(grid);
  });

  describe("Grid Navigation", () => {
    it("gets the first editable position", () => {
      const grid = createInitialGrid(fastFoodPuzzle);
      expect(getFirstEditablePosition(grid)).toEqual({ wordIndex: 0, letterIndex: 1 });
    });

    it("navigates forward through editable tiles and crosses words", () => {
      const grid = createInitialGrid(fastFoodPuzzle);

      const next1 = getNextEditablePosition(grid, { wordIndex: 0, letterIndex: 1 });
      expect(next1).toEqual({ wordIndex: 0, letterIndex: 2 });

      const next2 = getNextEditablePosition(grid, { wordIndex: 0, letterIndex: 2 });
      expect(next2).toEqual({ wordIndex: 0, letterIndex: 3 });

      // Cross from end of Word 0 to first editable tile in Word 1 (skipping fixed tile 0)
      const nextWord = getNextEditablePosition(grid, { wordIndex: 0, letterIndex: 3 });
      expect(nextWord).toEqual({ wordIndex: 1, letterIndex: 1 });

      // Reaching the very end returns null
      const endOfGrid = getNextEditablePosition(grid, { wordIndex: 1, letterIndex: 3 });
      expect(endOfGrid).toBeNull();
    });

    it("navigates backward through editable tiles and crosses words in reverse", () => {
      const grid = createInitialGrid(fastFoodPuzzle);

      const prev1 = getPreviousEditablePosition(grid, { wordIndex: 1, letterIndex: 2 });
      expect(prev1).toEqual({ wordIndex: 1, letterIndex: 1 });

      // Cross backward from Word 1 to end of Word 0
      const prevWord = getPreviousEditablePosition(grid, { wordIndex: 1, letterIndex: 1 });
      expect(prevWord).toEqual({ wordIndex: 0, letterIndex: 3 });

      // Beginning of editable tiles returns null
      const startOfGrid = getPreviousEditablePosition(grid, { wordIndex: 0, letterIndex: 1 });
      expect(startOfGrid).toBeNull();
    });
  });

  describe("String Extraction & Grid State Inspection", () => {
    it("extracts word and phrase strings accurately", () => {
      let grid = createInitialGrid(fastFoodPuzzle);
      grid = enterLetter(grid, fastFoodPuzzle, { wordIndex: 0, letterIndex: 1 }, "A");
      grid = enterLetter(grid, fastFoodPuzzle, { wordIndex: 0, letterIndex: 2 }, "S");
      grid = enterLetter(grid, fastFoodPuzzle, { wordIndex: 0, letterIndex: 3 }, "T");

      expect(getWordString(grid, 0)).toBe("FAST");
      expect(getWordString(grid, 1)).toBe("F");
      expect(getPhraseString(grid)).toBe("FAST F");
      expect(isGridFilled(grid)).toBe(false);

      grid = enterLetter(grid, fastFoodPuzzle, { wordIndex: 1, letterIndex: 1 }, "O");
      grid = enterLetter(grid, fastFoodPuzzle, { wordIndex: 1, letterIndex: 2 }, "O");
      grid = enterLetter(grid, fastFoodPuzzle, { wordIndex: 1, letterIndex: 3 }, "D");

      expect(getWordString(grid, 1)).toBe("FOOD");
      expect(getPhraseString(grid)).toBe("FAST FOOD");
      expect(isGridFilled(grid)).toBe(true);
    });

    it("resets the grid cleanly to its initial state", () => {
      let grid = createInitialGrid(fastFoodPuzzle);
      grid = enterLetter(grid, fastFoodPuzzle, { wordIndex: 0, letterIndex: 1 }, "A");
      expect(isGridFilled(grid)).toBe(false);

      const fresh = resetGrid(fastFoodPuzzle);
      expect(fresh.words[0][1]?.letter).toBe("");
      expect(fresh.words[0][0]?.letter).toBe("F");
    });
  });

  describe("Immutability", () => {
    it("maintains strict immutability across grid operations", () => {
      const original = createInitialGrid(fastFoodPuzzle);
      const modified = enterLetter(original, fastFoodPuzzle, { wordIndex: 0, letterIndex: 1 }, "A");

      expect(original.words[0][1]?.letter).toBe("");
      expect(modified.words[0][1]?.letter).toBe("A");
      expect(original).not.toBe(modified);
      expect(original.words[0]).not.toBe(modified.words[0]);
    });
  });
});
