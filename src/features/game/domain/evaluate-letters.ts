import type { LetterTile, TileFeedback } from "./types";
import { normalizeWord } from "./normalize-answer";

/**
 * Interface for letter evaluation engines.
 * Keeps the feedback algorithm pluggable and replaceable.
 */
export interface LetterEvaluationEngine {
  evaluateWordTiles(targetWord: string, tiles: readonly LetterTile[]): readonly LetterTile[];
}

/**
 * Deterministic letter evaluator adhering to strict feedback rules:
 *
 * 1. Fixed clue letters are always CONFIRMED.
 * 2. Empty tiles have NONE feedback.
 * 3. Exact position matches with canonical letters are marked CONFIRMED.
 * 4. Letters in incorrect positions that exist in the target word with remaining
 *    unmatched count are marked PENDING (neither confirmed nor prematurely eliminated).
 * 5. Letters that do not exist in the target word (or whose occurrences are already
 *    fully accounted for) are marked ELIMINATED.
 * 6. Incorrect/eliminated letters remain fully editable by the player.
 */
export function evaluateWordTiles(
  rawTargetWord: string,
  tiles: readonly LetterTile[]
): readonly LetterTile[] {
  const targetWord = normalizeWord(rawTargetWord);
  const n = targetWord.length;

  if (tiles.length !== n) {
    throw new Error(
      `Tile count (${tiles.length}) does not match target word length (${n}) for '${targetWord}'.`
    );
  }

  // Count available occurrences of each letter in the target word
  const letterPool: Record<string, number> = {};
  for (let i = 0; i < n; i++) {
    const char = targetWord[i]!;
    letterPool[char] = (letterPool[char] || 0) + 1;
  }

  const resultFeedback: TileFeedback[] = new Array(n).fill("NONE");
  const isEvaluated: boolean[] = new Array(n).fill(false);

  // First Pass: Identify Fixed tiles and Exact Positional Matches (CONFIRMED)
  for (let i = 0; i < n; i++) {
    const tile = tiles[i]!;
    const char = tile.letter;

    if (tile.isFixed) {
      resultFeedback[i] = "CONFIRMED";
      isEvaluated[i] = true;
      const count = letterPool[char] ?? 0;
      if (count > 0) {
        letterPool[char] = count - 1;
      }
    } else if (char && char === targetWord[i]) {
      resultFeedback[i] = "CONFIRMED";
      isEvaluated[i] = true;
      const count = letterPool[char] ?? 0;
      if (count > 0) {
        letterPool[char] = count - 1;
      }
    }
  }

  // Second Pass: Process remaining empty or non-matching tiles
  for (let i = 0; i < n; i++) {
    const tile = tiles[i]!;
    const char = tile.letter;

    // Skip tiles already evaluated in the first pass
    if (resultFeedback[i] === "CONFIRMED") {
      continue;
    }

    if (!char) {
      resultFeedback[i] = "NONE";
      isEvaluated[i] = false;
      continue;
    }

    const available = letterPool[char] ?? 0;
    if (available > 0) {
      // Letter exists in target word and has remaining unassigned occurrences
      resultFeedback[i] = "PENDING";
      isEvaluated[i] = true;
      letterPool[char] = available - 1;
    } else {
      // Letter does not appear in target word (or all occurrences are already accounted for)
      resultFeedback[i] = "ELIMINATED";
      isEvaluated[i] = true;
    }
  }

  // Construct updated tiles preserving immutability
  return tiles.map((tile, i) => ({
    ...tile,
    feedback: resultFeedback[i]!,
    isEvaluated: isEvaluated[i]!,
    isEntered: !tile.isFixed && Boolean(tile.letter),
  }));
}

export const defaultLetterEvaluator: LetterEvaluationEngine = {
  evaluateWordTiles,
};
