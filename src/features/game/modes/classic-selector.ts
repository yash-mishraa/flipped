import { CURATED_PUZZLES, PUZZLES_BY_ID } from "../data/puzzles";
import { getRecentDailyAnswerWords } from "../data/daily-schedule";
import type { Difficulty, Puzzle } from "../domain/types";

export interface ClassicSelectOptions {
  readonly recentPuzzleIds?: readonly string[];
  readonly recentAnswerWords?: readonly string[];
  readonly randomFn?: () => number;
}

export type ClassicSelectResult =
  | {
      readonly status: "SUCCESS";
      readonly puzzle: Puzzle;
    }
  | {
      readonly status: "EMPTY_POOL";
      readonly difficulty: Difficulty;
      readonly message: string;
    };

/**
 * Selects a puzzle for Classic mode strictly matching the requested difficulty.
 * Avoids recent repetitions, handles exhausted pools gracefully, and supports
 * deterministic random functions for reproducible testing.
 */
export function selectClassicPuzzle(
  difficulty: Difficulty,
  options: ClassicSelectOptions = {}
): ClassicSelectResult {
  const { recentPuzzleIds = [], recentAnswerWords = [], randomFn = Math.random } = options;

  // Filter puzzles strictly by difficulty
  const eligible = CURATED_PUZZLES.filter((p) => p.difficulty === difficulty);

  if (eligible.length === 0) {
    return {
      status: "EMPTY_POOL",
      difficulty,
      message: `No puzzles found matching difficulty tier "${difficulty}".`,
    };
  }

  // 1. Collect all recently seen answer words and phrases
  const recentWordSet = new Set<string>();
  const recentPhraseSet = new Set<string>();

  for (const w of recentAnswerWords) {
    if (w) recentWordSet.add(w.toUpperCase());
  }

  for (const id of recentPuzzleIds) {
    const puzzle = PUZZLES_BY_ID.get(id);
    if (puzzle) {
      recentPhraseSet.add(puzzle.answerWords.join(" ").toUpperCase());
      for (const w of puzzle.answerWords) {
        if (w) recentWordSet.add(w.toUpperCase());
      }
    }
  }

  // Also avoid daily challenge answer words from the last 60 days to prevent cross-mode repetition
  const dailyWords = getRecentDailyAnswerWords(60);
  for (const w of dailyWords) {
    if (w) recentWordSet.add(w.toUpperCase());
  }

  // 2. Strict Pool: Completely unplayed IDs with NO overlap in answer words or answer phrases
  const strictPool = eligible.filter((p) => {
    if (recentPuzzleIds.includes(p.id)) return false;
    const phrase = p.answerWords.join(" ").toUpperCase();
    if (recentPhraseSet.has(phrase)) return false;
    const w1 = p.answerWords[0]?.toUpperCase() ?? "";
    const w2 = p.answerWords[1]?.toUpperCase() ?? "";
    if (recentWordSet.has(w1) || recentWordSet.has(w2)) {
      return false;
    }
    return true;
  });

  if (strictPool.length > 0) {
    const safeRandom = Math.max(0, Math.min(0.999999, randomFn()));
    const selectedIndex = Math.floor(safeRandom * strictPool.length);
    const selected = strictPool[selectedIndex] ?? strictPool[0]!;
    return {
      status: "SUCCESS",
      puzzle: selected,
    };
  }

  // 3. Fallback when strict pool is exhausted (e.g. extensive session or testing):
  // Filter unplayed IDs that don't repeat immediate recent puzzle ID or its answer words
  const immediateRecentId = recentPuzzleIds[0];
  const immediatePuzzle = immediateRecentId ? PUZZLES_BY_ID.get(immediateRecentId) : null;
  const immediateWords = new Set(
    immediatePuzzle?.answerWords.map((w) => w.toUpperCase()) ?? []
  );

  const unplayedPool = eligible.filter((p) => !recentPuzzleIds.includes(p.id));
  const unplayedSafe = unplayedPool.filter((p) => {
    const w1 = p.answerWords[0]?.toUpperCase() ?? "";
    const w2 = p.answerWords[1]?.toUpperCase() ?? "";
    return !immediateWords.has(w1) && !immediateWords.has(w2);
  });

  const bestUnplayed = unplayedSafe.length > 0 ? unplayedSafe : unplayedPool;
  if (bestUnplayed.length > 0) {
    const safeRandom = Math.max(0, Math.min(0.999999, randomFn()));
    const selectedIndex = Math.floor(safeRandom * bestUnplayed.length);
    const selected = bestUnplayed[selectedIndex] ?? bestUnplayed[0]!;
    return {
      status: "SUCCESS",
      puzzle: selected,
    };
  }

  // 4. Fallback when all puzzles in this difficulty were recently played:
  if (eligible.length === 1) {
    return {
      status: "SUCCESS",
      puzzle: eligible[0]!,
    };
  }

  // Avoid the immediate most recent puzzle and its words
  const nonImmediatePool = eligible.filter((p) => {
    if (p.id === immediateRecentId) return false;
    const w1 = p.answerWords[0]?.toUpperCase() ?? "";
    const w2 = p.answerWords[1]?.toUpperCase() ?? "";
    return !immediateWords.has(w1) && !immediateWords.has(w2);
  });
  const fallbackPool = nonImmediatePool.length > 0 ? nonImmediatePool : eligible;

  const safeRandom = Math.max(0, Math.min(0.999999, randomFn()));
  const selectedIndex = Math.floor(safeRandom * fallbackPool.length);
  const selected = fallbackPool[selectedIndex] ?? fallbackPool[0]!;

  return {
    status: "SUCCESS",
    puzzle: selected,
  };
}

export { getPuzzleCountsByDifficulty } from "../data/public-puzzles";
