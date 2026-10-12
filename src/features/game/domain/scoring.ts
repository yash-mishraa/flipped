/**
 * Deterministic scoring engine.
 * Computes scores purely from elapsed time and hints used.
 */

export const SCORING_CONFIG = {
  BASE_SCORE: 100,
  MIN_SCORE: 0,
  MAX_SCORE: 100,
  HINT_PENALTY_POINTS: 5,
  TIME_PENALTY_INTERVAL_SECONDS: 5,
} as const;

/**
 * Calculates a round score according to the canonical formula:
 * score = max(0, min(100, 100 - floor(elapsedSeconds / 5) - (hintsUsed * 5)))
 *
 * Validates that elapsedSeconds and hintsUsed are finite, non-negative numbers.
 */
export function calculateScore(elapsedSeconds: number, hintsUsed: number): number {
  if (typeof elapsedSeconds !== "number" || !Number.isFinite(elapsedSeconds)) {
    throw new TypeError(
      `elapsedSeconds must be a finite number, received '${String(elapsedSeconds)}'.`
    );
  }

  if (elapsedSeconds < 0) {
    throw new RangeError(`elapsedSeconds cannot be negative, received '${elapsedSeconds}'.`);
  }

  if (typeof hintsUsed !== "number" || !Number.isFinite(hintsUsed)) {
    throw new TypeError(`hintsUsed must be a finite number, received '${String(hintsUsed)}'.`);
  }

  if (hintsUsed < 0) {
    throw new RangeError(`hintsUsed cannot be negative, received '${hintsUsed}'.`);
  }

  const timePenalty = Math.floor(elapsedSeconds / SCORING_CONFIG.TIME_PENALTY_INTERVAL_SECONDS);
  const hintPenalty = hintsUsed * SCORING_CONFIG.HINT_PENALTY_POINTS;
  const rawScore = SCORING_CONFIG.BASE_SCORE - timePenalty - hintPenalty;

  return Math.max(SCORING_CONFIG.MIN_SCORE, Math.min(SCORING_CONFIG.MAX_SCORE, rawScore));
}
