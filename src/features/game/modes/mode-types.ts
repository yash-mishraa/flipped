import type { Difficulty, Puzzle } from "../domain/types";

export type GameMode = "DAILY" | "CLASSIC";

export type PublicationStatus = "PUBLISHED" | "UNPUBLISHED";

export interface DailyPuzzleAssignment {
  readonly date: string; // YYYY-MM-DD calendar date
  readonly puzzleId: string;
  readonly publicationStatus: PublicationStatus;
  readonly note?: string;
}

export type DailyAttemptStatus = "UNPLAYED" | "WON" | "TIMED_OUT";

export interface DailyAttemptRecord {
  readonly date: string; // YYYY-MM-DD
  readonly puzzleId: string;
  readonly status: "WON" | "TIMED_OUT";
  readonly finalScore: number;
  readonly elapsedSeconds: number;
  readonly hintsUsed: number;
  readonly solvedPhrase?: string;
  readonly completedAt: string;
  readonly isArchive?: boolean;
}

export interface ClassicHistoryRecord {
  readonly recentlyPlayedIds: readonly string[];
  readonly lastDifficulty: Difficulty;
  readonly totalPlayed: number;
  readonly totalWins: number;
}

export type DailyPuzzleResult =
  | {
      readonly status: "AVAILABLE";
      readonly date: string;
      readonly puzzle: Puzzle;
      readonly assignment: DailyPuzzleAssignment;
    }
  | {
      readonly status: "FUTURE_UNPUBLISHED";
      readonly date: string;
      readonly message: string;
    }
  | {
      readonly status: "UNAVAILABLE";
      readonly date: string;
      readonly message: string;
    };

export interface RoundConfiguration {
  readonly mode: GameMode;
  readonly puzzle: Puzzle;
  readonly difficulty: Difficulty;
  readonly date?: string;
  readonly isReadOnly?: boolean;
  readonly previousResult?: DailyAttemptRecord;
}
