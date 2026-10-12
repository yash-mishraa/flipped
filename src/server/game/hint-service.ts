import type { Puzzle } from "@/features/game/domain/types";
import { inMemoryDb, type StoredAttempt } from "../db/client";

export interface ServerHintResult {
  readonly success: boolean;
  readonly wordIndex?: 0 | 1;
  readonly letterIndex?: number;
  readonly letter?: string;
  readonly hintsUsed?: number;
  readonly message?: string;
}

/**
 * Computes all editable (hintable) positions in canonical reading order.
 * Index 0 of both answer words is permanently fixed and excluded from hints.
 */
export function getHintablePositions(
  puzzle: Puzzle
): Array<{ wordIndex: 0 | 1; letterIndex: number }> {
  const positions: Array<{ wordIndex: 0 | 1; letterIndex: number }> = [];

  const word0 = puzzle.answerWords[0] || "";
  for (let i = 1; i < word0.length; i++) {
    positions.push({ wordIndex: 0, letterIndex: i });
  }

  const word1 = puzzle.answerWords[1] || "";
  for (let i = 1; i < word1.length; i++) {
    positions.push({ wordIndex: 1, letterIndex: i });
  }

  return positions;
}

/**
 * Authoritatively processes a hint request on the server.
 * Ensures attempt is active, deadline has not passed, increments hint count,
 * and reveals ONLY the single authorized letter and position.
 */
export async function processAuthoritativeHint(
  attempt: StoredAttempt,
  puzzle: Puzzle
): Promise<ServerHintResult> {
  if (attempt.status !== "ACTIVE") {
    return {
      success: false,
      message: "Cannot request hints on a finalized attempt.",
    };
  }

  const now = Date.now();
  if (now >= attempt.deadline.getTime()) {
    // If deadline has passed, attempt is expired
    return {
      success: false,
      message: "Time limit has expired. No more hints may be used.",
    };
  }

  const hintable = getHintablePositions(puzzle);
  if (attempt.hintsUsed >= hintable.length) {
    return {
      success: false,
      message: "No further hints are available for this puzzle.",
    };
  }

  const targetPosition = hintable[attempt.hintsUsed]!;
  const letter = puzzle.answerWords[targetPosition.wordIndex]
    .charAt(targetPosition.letterIndex)
    .toUpperCase();

  // Atomically increment server-tracked hint count
  const updatedAttempt: StoredAttempt = {
    ...attempt,
    hintsUsed: attempt.hintsUsed + 1,
    updatedAt: new Date(),
  };

  inMemoryDb.saveAttempt(updatedAttempt);

  return {
    success: true,
    wordIndex: targetPosition.wordIndex,
    letterIndex: targetPosition.letterIndex,
    letter,
    hintsUsed: updatedAttempt.hintsUsed,
  };
}
