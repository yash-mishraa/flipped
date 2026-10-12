import { describe, it, expect } from "vitest";
import { evaluateWordTiles } from "@/features/game/domain/evaluate-letters";
import type { LetterTile } from "@/features/game/domain/types";

describe("Deterministic Letter Elimination & Confirmation Algorithm", () => {
  const createTile = (
    letter: string,
    isFixed = false,
    letterIndex = 0,
    wordIndex: 0 | 1 = 0
  ): LetterTile => ({
    wordIndex,
    letterIndex,
    letter,
    isFixed,
    isEntered: !isFixed && Boolean(letter),
    isEvaluated: false,
    feedback: "NONE",
  });

  it("marks fixed clue letters as CONFIRMED", () => {
    const tiles: LetterTile[] = [
      createTile("F", true, 0),
      createTile("", false, 1),
      createTile("", false, 2),
      createTile("", false, 3),
    ];

    const evaluated = evaluateWordTiles("FAST", tiles);
    expect(evaluated[0]?.feedback).toBe("CONFIRMED");
    expect(evaluated[0]?.isEvaluated).toBe(true);
    expect(evaluated[1]?.feedback).toBe("NONE");
    expect(evaluated[2]?.feedback).toBe("NONE");
    expect(evaluated[3]?.feedback).toBe("NONE");
  });

  it("marks correct letters at exact positions as CONFIRMED", () => {
    const tiles: LetterTile[] = [
      createTile("F", true, 0),
      createTile("A", false, 1),
      createTile("S", false, 2),
      createTile("T", false, 3),
    ];

    const evaluated = evaluateWordTiles("FAST", tiles);
    expect(evaluated.every((t) => t.feedback === "CONFIRMED")).toBe(true);
  });

  it("marks letters absent from the target word as ELIMINATED", () => {
    const tiles: LetterTile[] = [
      createTile("F", true, 0),
      createTile("Z", false, 1),
      createTile("X", false, 2),
      createTile("", false, 3),
    ];

    const evaluated = evaluateWordTiles("FAST", tiles);
    expect(evaluated[1]?.feedback).toBe("ELIMINATED");
    expect(evaluated[2]?.feedback).toBe("ELIMINATED");
    expect(evaluated[3]?.feedback).toBe("NONE");
  });

  it("marks letters in wrong position as PENDING when they exist elsewhere in target", () => {
    // Target is FAST. Player enters T at pos 1, A at pos 2.
    // T belongs at pos 3, A belongs at pos 1.
    const tiles: LetterTile[] = [
      createTile("F", true, 0),
      createTile("T", false, 1), // T is in FAST
      createTile("A", false, 2), // A is in FAST
      createTile("", false, 3),
    ];

    const evaluated = evaluateWordTiles("FAST", tiles);
    expect(evaluated[1]?.feedback).toBe("PENDING"); // NOT eliminated!
    expect(evaluated[2]?.feedback).toBe("PENDING"); // NOT eliminated!
    expect(evaluated[3]?.feedback).toBe("NONE");
  });

  describe("Repeated Letter Disambiguation", () => {
    it("handles multiple occurrences in target word (FOOD with 2 'O's)", () => {
      // Both 'O's in correct positions
      const bothCorrect: LetterTile[] = [
        createTile("F", true, 0),
        createTile("O", false, 1),
        createTile("O", false, 2),
        createTile("", false, 3),
      ];
      const evalBoth = evaluateWordTiles("FOOD", bothCorrect);
      expect(evalBoth[1]?.feedback).toBe("CONFIRMED");
      expect(evalBoth[2]?.feedback).toBe("CONFIRMED");

      // One 'O' at correct position 1, second 'O' at wrong position 3 (target[3] is 'D')
      const oneRightOneWrong: LetterTile[] = [
        createTile("F", true, 0),
        createTile("O", false, 1), // Correct pos 1
        createTile("", false, 2),
        createTile("O", false, 3), // Wrong pos 3, but target has 1 remaining 'O'
      ];
      const evalOneOne = evaluateWordTiles("FOOD", oneRightOneWrong);
      expect(evalOneOne[1]?.feedback).toBe("CONFIRMED");
      expect(evalOneOne[3]?.feedback).toBe("PENDING");

      // Three 'O's entered (target only has two) -> third 'O' must be ELIMINATED
      const threeOs: LetterTile[] = [
        createTile("F", true, 0),
        createTile("O", false, 1), // First 'O' CONFIRMED
        createTile("O", false, 2), // Second 'O' CONFIRMED
        createTile("O", false, 3), // Third 'O' -> ELIMINATED (no available 'O' left)
      ];
      const evalThree = evaluateWordTiles("FOOD", threeOs);
      expect(evalThree[1]?.feedback).toBe("CONFIRMED");
      expect(evalThree[2]?.feedback).toBe("CONFIRMED");
      expect(evalThree[3]?.feedback).toBe("ELIMINATED");
    });

    it("handles single-occurrence target with duplicate player entries (FAST with 1 'A')", () => {
      const duplicateA: LetterTile[] = [
        createTile("F", true, 0),
        createTile("A", false, 1), // Matches target[1] -> CONFIRMED
        createTile("A", false, 2), // Extra 'A' -> ELIMINATED
        createTile("", false, 3),
      ];

      const evaluated = evaluateWordTiles("FAST", duplicateA);
      expect(evaluated[1]?.feedback).toBe("CONFIRMED");
      expect(evaluated[2]?.feedback).toBe("ELIMINATED");
    });
  });

  describe("Immutability & Error Handling", () => {
    it("does not mutate the input tile objects", () => {
      const tile0 = createTile("F", true, 0);
      const tile1 = createTile("Z", false, 1);
      const originalTiles = [tile0, tile1];

      const evaluated = evaluateWordTiles("FZ", originalTiles);
      expect(evaluated[1]?.feedback).toBe("CONFIRMED");
      expect(tile1.feedback).toBe("NONE"); // original untouched
    });

    it("throws an error when tile count does not match target word length", () => {
      const tooFewTiles = [createTile("F", true, 0)];
      expect(() => evaluateWordTiles("FAST", tooFewTiles)).toThrowError(
        /Tile count \(1\) does not match target word length \(4\)/
      );
    });
  });
});
