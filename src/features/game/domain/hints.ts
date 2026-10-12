import type { HintResult, LetterGrid, Puzzle, TilePosition } from "./types";
import { normalizeWord } from "./normalize-answer";
import { enterLetter } from "./letter-grid";

/**
 * Deterministic hint-selection policy:
 * Scans in standard reading order (Word 0 left-to-right, then Word 1 left-to-right).
 * Finds the first tile that:
 * 1. Is not fixed (isFixed === false).
 * 2. Does not already contain the correct target letter (letter !== targetLetter).
 *
 * Never overrides a fixed letter.
 * Never erases a correct letter the player has already found.
 */
export function selectNextHint(grid: LetterGrid, puzzle: Puzzle): HintResult {
  const targetWords = [
    normalizeWord(puzzle.answerWords[0]),
    normalizeWord(puzzle.answerWords[1]),
  ] as const;

  for (const wordIndex of [0, 1] as const) {
    const targetWord = targetWords[wordIndex];
    const tiles = grid.words[wordIndex];

    for (let letterIndex = 0; letterIndex < tiles.length; letterIndex++) {
      const tile = tiles[letterIndex]!;
      const correctLetter = targetWord[letterIndex]!;

      // Skip fixed clue tiles
      if (tile.isFixed) {
        continue;
      }

      // Skip tiles already containing the correct letter
      if (tile.letter === correctLetter) {
        continue;
      }

      return {
        success: true,
        position: { wordIndex, letterIndex },
        letter: correctLetter,
      };
    }
  }

  return {
    success: false,
    reason: "NO_ELIGIBLE_TILES",
  };
}

/**
 * Applies a selected hint to the grid, entering the revealed letter
 * and updating the letter evaluation state.
 */
export function applyHintToGrid(
  grid: LetterGrid,
  puzzle: Puzzle,
  hint: { position: TilePosition; letter: string }
): LetterGrid {
  return enterLetter(grid, puzzle, hint.position, hint.letter);
}
