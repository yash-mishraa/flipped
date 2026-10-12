import type { Difficulty } from "../domain/types";
import { getDailyDateString, getDailyPuzzle } from "./daily-scheduler";
import {
  selectClassicPuzzle,
  type ClassicSelectOptions,
  type ClassicSelectResult,
} from "./classic-selector";
import { getDailyAttempt, getClassicRecentPuzzleIds } from "../persistence/local-progress";
import type { RoundConfiguration, DailyPuzzleResult } from "./mode-types";

/**
 * Creates the round configuration for the Daily challenge.
 * Checks whether the puzzle is available and whether the user already attempted it locally.
 */
export function createDailyRoundConfiguration(
  targetDate?: string,
  timezone?: string
):
  | { readonly success: true; readonly config: RoundConfiguration }
  | { readonly success: false; readonly result: DailyPuzzleResult } {
  const dateStr = targetDate ?? getDailyDateString(new Date(), timezone);
  const dailyResult = getDailyPuzzle(dateStr);

  if (dailyResult.status !== "AVAILABLE") {
    return {
      success: false,
      result: dailyResult,
    };
  }

  const previousAttempt = getDailyAttempt(dateStr);

  return {
    success: true,
    config: {
      mode: "DAILY",
      puzzle: dailyResult.puzzle,
      difficulty: dailyResult.puzzle.difficulty,
      date: dateStr,
      isReadOnly: previousAttempt !== null,
      previousResult: previousAttempt ?? undefined,
    },
  };
}

/**
 * Creates the round configuration for a Classic mode game.
 */
export function createClassicRoundConfiguration(
  difficulty: Difficulty,
  options?: ClassicSelectOptions
):
  | { readonly success: true; readonly config: RoundConfiguration }
  | { readonly success: false; readonly result: ClassicSelectResult } {
  const recentIds = options?.recentPuzzleIds ?? getClassicRecentPuzzleIds();
  const selectResult = selectClassicPuzzle(difficulty, {
    ...options,
    recentPuzzleIds: recentIds,
  });

  if (selectResult.status !== "SUCCESS") {
    return {
      success: false,
      result: selectResult,
    };
  }

  return {
    success: true,
    config: {
      mode: "CLASSIC",
      puzzle: selectResult.puzzle,
      difficulty,
      isReadOnly: false,
    },
  };
}
