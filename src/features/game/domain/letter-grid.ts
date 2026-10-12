import type { LetterGrid, LetterTile, Puzzle, TilePosition } from "./types";
import { normalizeWord } from "./normalize-answer";
import { evaluateWordTiles } from "./evaluate-letters";

/**
 * Creates the initial letter grid for a given puzzle.
 * - Revealing the first letter of both answer words as FIXED.
 * - Initializing all subsequent tiles as empty and editable.
 */
export function createInitialGrid(puzzle: Puzzle): LetterGrid {
  const targetFirst = normalizeWord(puzzle.answerWords[0]);
  const targetSecond = normalizeWord(puzzle.answerWords[1]);

  const createWordTiles = (targetWord: string, wordIndex: 0 | 1): readonly LetterTile[] => {
    const tiles: LetterTile[] = [];

    for (let i = 0; i < targetWord.length; i++) {
      if (i === 0) {
        // First tile is permanently revealed and fixed
        tiles.push({
          wordIndex,
          letterIndex: 0,
          letter: targetWord[0]!,
          isFixed: true,
          isEntered: false,
          isEvaluated: true,
          feedback: "CONFIRMED",
        });
      } else {
        // Remaining tiles start empty and editable
        tiles.push({
          wordIndex,
          letterIndex: i,
          letter: "",
          isFixed: false,
          isEntered: false,
          isEvaluated: false,
          feedback: "NONE",
        });
      }
    }

    return evaluateWordTiles(targetWord, tiles);
  };

  const word0 = createWordTiles(targetFirst, 0);
  const word1 = createWordTiles(targetSecond, 1);

  return {
    words: [word0, word1],
  };
}

/**
 * Enters or replaces a letter at the specified position.
 * Pure operation returning an immutable new LetterGrid.
 * Rejects edits to fixed tiles.
 */
export function enterLetter(
  grid: LetterGrid,
  puzzle: Puzzle,
  position: TilePosition,
  rawLetter: string
): LetterGrid {
  const { wordIndex, letterIndex } = position;
  const currentWordTiles = grid.words[wordIndex];
  const targetTile = currentWordTiles[letterIndex];

  if (!targetTile) {
    return grid;
  }

  // Reject edits to fixed tiles
  if (targetTile.isFixed) {
    return grid;
  }

  const cleanLetter = normalizeWord(rawLetter).slice(0, 1);
  if (!cleanLetter) {
    return grid;
  }

  const updatedTiles = currentWordTiles.map((tile, idx) => {
    if (idx !== letterIndex) {
      return tile;
    }
    return {
      ...tile,
      letter: cleanLetter,
      isEntered: true,
    };
  });

  const targetWord = puzzle.answerWords[wordIndex];
  const evaluatedTiles = evaluateWordTiles(targetWord, updatedTiles);

  const newWords: [readonly LetterTile[], readonly LetterTile[]] = [
    wordIndex === 0 ? evaluatedTiles : grid.words[0],
    wordIndex === 1 ? evaluatedTiles : grid.words[1],
  ];

  return {
    words: newWords,
  };
}

/**
 * Clears an entered letter from an editable tile.
 * Pure operation returning an immutable new LetterGrid.
 * Rejects clearing fixed tiles.
 */
export function clearTile(grid: LetterGrid, puzzle: Puzzle, position: TilePosition): LetterGrid {
  const { wordIndex, letterIndex } = position;
  const currentWordTiles = grid.words[wordIndex];
  const targetTile = currentWordTiles[letterIndex];

  if (!targetTile) {
    return grid;
  }

  // Reject clearing fixed tiles
  if (targetTile.isFixed) {
    return grid;
  }

  // If already empty, return grid without changes
  if (!targetTile.letter) {
    return grid;
  }

  const updatedTiles = currentWordTiles.map((tile, idx) => {
    if (idx !== letterIndex) {
      return tile;
    }
    return {
      ...tile,
      letter: "",
      isEntered: false,
      isEvaluated: false,
      feedback: "NONE" as const,
    };
  });

  const targetWord = puzzle.answerWords[wordIndex];
  const evaluatedTiles = evaluateWordTiles(targetWord, updatedTiles);

  const newWords: [readonly LetterTile[], readonly LetterTile[]] = [
    wordIndex === 0 ? evaluatedTiles : grid.words[0],
    wordIndex === 1 ? evaluatedTiles : grid.words[1],
  ];

  return {
    words: newWords,
  };
}

/**
 * Resets the entire grid back to its initial state for the given puzzle.
 */
export function resetGrid(puzzle: Puzzle): LetterGrid {
  return createInitialGrid(puzzle);
}

/**
 * Finds the next editable (non-fixed) tile in reading order.
 */
export function getNextEditablePosition(
  grid: LetterGrid,
  current: TilePosition
): TilePosition | null {
  const { wordIndex, letterIndex } = current;

  // Search forward in the same word
  for (let idx = letterIndex + 1; idx < grid.words[wordIndex].length; idx++) {
    const tile = grid.words[wordIndex][idx];
    if (tile && !tile.isFixed) {
      return { wordIndex, letterIndex: idx };
    }
  }

  // If currently in word 0, search in word 1
  if (wordIndex === 0) {
    for (let idx = 0; idx < grid.words[1].length; idx++) {
      const tile = grid.words[1][idx];
      if (tile && !tile.isFixed) {
        return { wordIndex: 1, letterIndex: idx };
      }
    }
  }

  return null;
}

/**
 * Finds the previous editable (non-fixed) tile in reading order.
 */
export function getPreviousEditablePosition(
  grid: LetterGrid,
  current: TilePosition
): TilePosition | null {
  const { wordIndex, letterIndex } = current;

  // Search backward in the same word
  for (let idx = letterIndex - 1; idx >= 0; idx--) {
    const tile = grid.words[wordIndex][idx];
    if (tile && !tile.isFixed) {
      return { wordIndex, letterIndex: idx };
    }
  }

  // If currently in word 1, search backward from the end of word 0
  if (wordIndex === 1) {
    for (let idx = grid.words[0].length - 1; idx >= 0; idx--) {
      const tile = grid.words[0][idx];
      if (tile && !tile.isFixed) {
        return { wordIndex: 0, letterIndex: idx };
      }
    }
  }

  return null;
}

/**
 * Returns the first editable position on the grid.
 */
export function getFirstEditablePosition(grid: LetterGrid): TilePosition {
  for (const wordIndex of [0, 1] as const) {
    for (let idx = 0; idx < grid.words[wordIndex].length; idx++) {
      const tile = grid.words[wordIndex][idx];
      if (tile && !tile.isFixed) {
        return { wordIndex, letterIndex: idx };
      }
    }
  }
  return { wordIndex: 0, letterIndex: 0 };
}

/**
 * Extracts a word string from the letter tiles at the specified wordIndex.
 */
export function getWordString(grid: LetterGrid, wordIndex: 0 | 1): string {
  return grid.words[wordIndex].map((t) => t.letter).join("");
}

/**
 * Extracts the full candidate phrase (word0 + " " + word1) from the grid.
 */
export function getPhraseString(grid: LetterGrid): string {
  return `${getWordString(grid, 0)} ${getWordString(grid, 1)}`;
}

/**
 * Checks if every single tile on the grid has a non-empty letter.
 */
export function isGridFilled(grid: LetterGrid): boolean {
  const allWord0Filled = grid.words[0].every((t) => Boolean(t.letter));
  const allWord1Filled = grid.words[1].every((t) => Boolean(t.letter));
  return allWord0Filled && allWord1Filled;
}
