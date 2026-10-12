import { CURATED_PUZZLES } from "../data/puzzles";
import type { Difficulty, Puzzle } from "../domain/types";

export interface ClassicSelectOptions {
  readonly recentPuzzleIds?: readonly string[];
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
  const { recentPuzzleIds = [], randomFn = Math.random } = options;

  // Filter puzzles strictly by difficulty
  const eligible = CURATED_PUZZLES.filter((p) => p.difficulty === difficulty);

  if (eligible.length === 0) {
    return {
      status: "EMPTY_POOL",
      difficulty,
      message: `No puzzles found matching difficulty tier "${difficulty}".`,
    };
  }

  // First priority: puzzles that haven't been played recently at all
  const unplayedPool = eligible.filter((p) => !recentPuzzleIds.includes(p.id));

  if (unplayedPool.length > 0) {
    const safeRandom = Math.max(0, Math.min(0.999999, randomFn()));
    const selectedIndex = Math.floor(safeRandom * unplayedPool.length);
    const selected = unplayedPool[selectedIndex] ?? unplayedPool[0]!;
    return {
      status: "SUCCESS",
      puzzle: selected,
    };
  }

  // Fallback when all puzzles in this difficulty were recently played:
  // If only 1 puzzle exists in tier, return it
  if (eligible.length === 1) {
    return {
      status: "SUCCESS",
      puzzle: eligible[0]!,
    };
  }

  // Otherwise, avoid the most recently played puzzle (recentPuzzleIds[0])
  const immediateRecentId = recentPuzzleIds[0];
  const nonImmediatePool = eligible.filter((p) => p.id !== immediateRecentId);
  const fallbackPool = nonImmediatePool.length > 0 ? nonImmediatePool : eligible;

  const safeRandom = Math.max(0, Math.min(0.999999, randomFn()));
  const selectedIndex = Math.floor(safeRandom * fallbackPool.length);
  const selected = fallbackPool[selectedIndex] ?? fallbackPool[0]!;

  return {
    status: "SUCCESS",
    puzzle: selected,
  };
}
