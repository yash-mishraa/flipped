import { inMemoryDb, type StoredAttempt } from "../db/client";
import type { Difficulty, Puzzle } from "@/features/game/domain/types";
import { selectClassicPuzzle } from "@/features/game/modes/classic-selector";
import { getServerDailyDateString } from "../scheduling/daily-scheduler";

/**
 * Public gameplay payload delivered to the client during active gameplay.
 * STRICTLY OMITS canonical answers, transformation answers, and approved variants.
 */
export interface SafeGameplayPayload {
  readonly attemptId: string;
  readonly mode: "DAILY" | "CLASSIC";
  readonly date?: string;
  readonly puzzleId: string;
  readonly clueWords: readonly [string, string];
  readonly difficulty: Difficulty;
  readonly firstLetters: readonly [string, string];
  readonly wordLengths: readonly [number, number];
  readonly startedAt: string;
  readonly deadline: string;
  readonly hintsUsed: number;
  readonly transformations: readonly [
    { readonly clueWord: string; readonly relationship: "SYNONYM" | "ANTONYM" },
    { readonly clueWord: string; readonly relationship: "SYNONYM" | "ANTONYM" },
  ];
}

/**
 * Full outcome result payload delivered ONLY after an attempt has reached a terminal state
 * (WON or TIMED_OUT). Safely reveals the target phrase and detailed explanations for review.
 */
export interface FinalizedResultPayload {
  readonly attemptId: string;
  readonly mode: "DAILY" | "CLASSIC";
  readonly date?: string;
  readonly puzzleId: string;
  readonly status: "WON" | "TIMED_OUT";
  readonly isWon: boolean;
  readonly finalScore: number;
  readonly elapsedSeconds: number;
  readonly hintsUsed: number;
  readonly canonicalPhrase: string;
  readonly solvedPhrase?: string;
  readonly transformations: readonly {
    readonly clueWord: string;
    readonly answerWord: string;
    readonly relationship: "SYNONYM" | "ANTONYM";
    readonly explanation: string;
  }[];
  readonly completedAt: string;
  readonly isArchive?: boolean;
}

/**
 * Server-only method to load complete privileged puzzle data.
 */
export async function getPrivilegedPuzzleById(puzzleId: string): Promise<Puzzle | null> {
  return inMemoryDb.getPuzzle(puzzleId);
}

/**
 * Selects an eligible Classic puzzle server-side matching requested difficulty,
 * avoiding recently played IDs without exposing the puzzle bank to the client.
 */
export async function selectServerClassicPuzzle(
  difficulty: Difficulty,
  recentPuzzleIds: readonly string[] = []
): Promise<Puzzle | null> {
  const result = selectClassicPuzzle(difficulty, { recentPuzzleIds });
  if (result.status === "SUCCESS") {
    return result.puzzle;
  }
  return null;
}

/**
 * Strips all confidential answer data from the puzzle and returns a safe payload
 * for active client gameplay.
 */
export function createSafeGameplayPayload(
  puzzle: Puzzle,
  attempt: StoredAttempt
): SafeGameplayPayload {
  const word0 = puzzle.answerWords[0] || "";
  const word1 = puzzle.answerWords[1] || "";

  return {
    attemptId: attempt.id,
    mode: attempt.mode,
    date: attempt.dailyDate ?? undefined,
    puzzleId: puzzle.id,
    clueWords: [puzzle.clueWords[0], puzzle.clueWords[1]],
    difficulty: puzzle.difficulty,
    firstLetters: [word0.charAt(0).toUpperCase(), word1.charAt(0).toUpperCase()],
    wordLengths: [word0.length, word1.length],
    startedAt: attempt.startedAt.toISOString(),
    deadline: attempt.deadline.toISOString(),
    hintsUsed: attempt.hintsUsed,
    transformations: [
      {
        clueWord: puzzle.transformations[0]!.clueWord,
        relationship: puzzle.transformations[0]!.relationship,
      },
      {
        clueWord: puzzle.transformations[1]!.clueWord,
        relationship: puzzle.transformations[1]!.relationship,
      },
    ],
  };
}

/**
 * Generates the full completion review payload for a finalized round.
 * Only callable when attempt.status is WON or TIMED_OUT.
 */
export function createFinalizedResultPayload(
  puzzle: Puzzle,
  attempt: StoredAttempt,
  referenceDate?: string
): FinalizedResultPayload {
  if (attempt.status === "ACTIVE") {
    throw new Error("Cannot generate finalized result for an active, incomplete attempt.");
  }

  const effectiveToday = referenceDate || getServerDailyDateString();

  return {
    attemptId: attempt.id,
    mode: attempt.mode,
    date: attempt.dailyDate ?? undefined,
    puzzleId: puzzle.id,
    status: attempt.status,
    isWon: attempt.isWon,
    finalScore: attempt.finalScore,
    elapsedSeconds: attempt.elapsedSeconds,
    hintsUsed: attempt.hintsUsed,
    canonicalPhrase: puzzle.answerWords.join(" "),
    solvedPhrase: attempt.solvedPhrase ?? undefined,
    transformations: puzzle.transformations.map((t) => ({
      clueWord: t.clueWord,
      answerWord: t.answerWord,
      relationship: t.relationship,
      explanation: t.explanation,
    })),
    completedAt: (attempt.endedAt ?? attempt.updatedAt).toISOString(),
    isArchive:
      attempt.mode === "DAILY"
        ? Boolean(attempt.dailyDate && attempt.dailyDate !== effectiveToday)
        : undefined,
  };
}
