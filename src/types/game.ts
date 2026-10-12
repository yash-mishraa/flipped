/**
 * Core type contracts for the Flipped word puzzle game.
 *
 * Designed to separate pure puzzle engine logic from presentation components,
 * enabling headless unit testing and future server-authoritative mechanics.
 */

export type GameMode = "daily" | "classic";

export type GameStatus = "idle" | "in_progress" | "completed" | "failed";

export type CellStatus = "empty" | "editing" | "correct" | "misplaced" | "incorrect";

export interface CellPosition {
  readonly row: number;
  readonly col: number;
}

export interface GridCell {
  readonly id: string;
  readonly position: CellPosition;
  readonly letter: string;
  readonly status: CellStatus;
  readonly isLocked: boolean;
}

export interface PuzzleMetadata {
  readonly id: string;
  readonly mode: GameMode;
  readonly targetWordLength: number;
  readonly maxAttempts?: number;
  /** ISO date string for Daily puzzles (YYYY-MM-DD) */
  readonly date?: string;
  /** Difficulty tier for Classic puzzles */
  readonly difficulty?: "easy" | "medium" | "hard";
}

export interface GameStateSnapshot {
  readonly puzzleId: string;
  readonly mode: GameMode;
  readonly status: GameStatus;
  readonly grid: ReadonlyArray<ReadonlyArray<GridCell>>;
  readonly currentAttempt: number;
  readonly startedAt: string;
  readonly completedAt?: string;
}

export interface ModeDescription {
  readonly mode: GameMode;
  readonly title: string;
  readonly badge: string;
  readonly description: string;
  readonly features: readonly string[];
}
