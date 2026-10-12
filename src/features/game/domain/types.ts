/**
 * Domain types for the Flipped word puzzle game engine.
 * Completely decoupled from React, DOM, and server infrastructure.
 */

export type RelationshipType = "SYNONYM" | "ANTONYM";

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export interface WordTransformation {
  readonly clueWord: string;
  readonly answerWord: string;
  readonly relationship: RelationshipType;
  readonly explanation: string;
}

export interface PuzzleMetadata {
  readonly publicationDate?: string;
  readonly author?: string;
  readonly hints?: readonly string[];
}

export interface Puzzle {
  readonly id: string;
  readonly clueWords: readonly [string, string];
  readonly answerWords: readonly [string, string];
  readonly transformations: readonly [WordTransformation, WordTransformation];
  readonly difficulty: Difficulty;
  readonly approvedVariants?: readonly string[];
  readonly metadata?: PuzzleMetadata;
}

export type TileFeedback = "NONE" | "CONFIRMED" | "ELIMINATED" | "PENDING";

export interface TilePosition {
  readonly wordIndex: 0 | 1;
  readonly letterIndex: number;
}

export interface LetterTile {
  readonly wordIndex: 0 | 1;
  readonly letterIndex: number;
  readonly letter: string;
  readonly isFixed: boolean;
  readonly isEntered: boolean;
  readonly isEvaluated: boolean;
  readonly feedback: TileFeedback;
}

export interface LetterGrid {
  readonly words: readonly [readonly LetterTile[], readonly LetterTile[]];
}

export type AnswerCheckStatus = "CORRECT" | "INCOMPLETE" | "INCORRECT";

export interface AnswerCheckDetails {
  readonly isFirstWordComplete: boolean;
  readonly isSecondWordComplete: boolean;
  readonly isFirstWordCorrect: boolean;
  readonly isSecondWordCorrect: boolean;
}

export interface AnswerCheckResult {
  readonly status: AnswerCheckStatus;
  readonly isMatch: boolean;
  readonly isVariantMatch: boolean;
  readonly message: string;
  readonly details: AnswerCheckDetails;
}

export type RoundStatus = "READY" | "PLAYING" | "WON" | "TIMED_OUT";

export interface TerminalResult {
  readonly status: "WON" | "TIMED_OUT";
  readonly finalScore: number;
  readonly elapsedSeconds: number;
  readonly hintsUsed: number;
  readonly completedAt: string;
  readonly solvedPhrase?: string;
}

export interface ReadyRoundState {
  readonly status: "READY";
  readonly puzzle: Puzzle;
  readonly grid: LetterGrid;
  readonly hintsUsed: number;
  readonly elapsedSeconds: number;
  readonly score: number;
  readonly selectedTilePosition: TilePosition | null;
  readonly lastValidationResult: AnswerCheckResult | null;
}

export interface PlayingRoundState {
  readonly status: "PLAYING";
  readonly puzzle: Puzzle;
  readonly grid: LetterGrid;
  readonly hintsUsed: number;
  readonly elapsedSeconds: number;
  readonly score: number;
  readonly selectedTilePosition: TilePosition | null;
  readonly lastValidationResult: AnswerCheckResult | null;
}

export interface WonRoundState {
  readonly status: "WON";
  readonly puzzle: Puzzle;
  readonly grid: LetterGrid;
  readonly hintsUsed: number;
  readonly elapsedSeconds: number;
  readonly score: number;
  readonly selectedTilePosition: null;
  readonly lastValidationResult: AnswerCheckResult;
  readonly terminalResult: TerminalResult;
}

export interface TimedOutRoundState {
  readonly status: "TIMED_OUT";
  readonly puzzle: Puzzle;
  readonly grid: LetterGrid;
  readonly hintsUsed: number;
  readonly elapsedSeconds: number;
  readonly score: number;
  readonly selectedTilePosition: null;
  readonly lastValidationResult: AnswerCheckResult | null;
  readonly terminalResult: TerminalResult;
}

export type RoundState = ReadyRoundState | PlayingRoundState | WonRoundState | TimedOutRoundState;

export type HintResult =
  | {
      readonly success: true;
      readonly position: TilePosition;
      readonly letter: string;
    }
  | {
      readonly success: false;
      readonly reason: "NO_ELIGIBLE_TILES" | "ROUND_NOT_ACTIVE";
    };

export interface PuzzleValidationError {
  readonly puzzleId: string;
  readonly field: string;
  readonly message: string;
}

export interface PuzzleValidationReport {
  readonly isValid: boolean;
  readonly totalValidated: number;
  readonly errors: readonly PuzzleValidationError[];
}
