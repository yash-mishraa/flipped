import type { Difficulty } from "../domain/types";

export interface PublicPuzzleInfo {
  readonly id: string;
  readonly clueWords: readonly [string, string];
  readonly difficulty: Difficulty;
  readonly wordLengths: readonly [number, number];
}

/**
 * Public, safe puzzle metadata for client presentation (Archive, counts, difficulty pills).
 * STRICTLY OMITS canonical answer words, transformations, and approved variants.
 */
export const PUBLIC_PUZZLE_METADATA: readonly PublicPuzzleInfo[] = [
  { id: "fast-food", clueWords: ["SLOW", "MEAL"], difficulty: "EASY", wordLengths: [4, 4] },
  { id: "war-cry", clueWords: ["PEACE", "LAUGH"], difficulty: "EASY", wordLengths: [3, 3] },
  { id: "hot-spring", clueWords: ["COLD", "WATER"], difficulty: "EASY", wordLengths: [3, 6] },
  { id: "open-door", clueWords: ["CLOSED", "GATE"], difficulty: "EASY", wordLengths: [4, 4] },
  { id: "good-night", clueWords: ["EVIL", "DAY"], difficulty: "EASY", wordLengths: [4, 5] },
  { id: "small-town", clueWords: ["BIG", "CITY"], difficulty: "EASY", wordLengths: [5, 4] },
  { id: "deep-sleep", clueWords: ["SHALLOW", "REST"], difficulty: "MEDIUM", wordLengths: [4, 5] },
  { id: "sweet-dreams", clueWords: ["SOUR", "VISIONS"], difficulty: "MEDIUM", wordLengths: [5, 6] },
  { id: "high-tide", clueWords: ["LOW", "CURRENT"], difficulty: "MEDIUM", wordLengths: [4, 4] },
  { id: "wild-life", clueWords: ["TAME", "EXISTENCE"], difficulty: "MEDIUM", wordLengths: [4, 4] },
  { id: "true-love", clueWords: ["FALSE", "AFFECTION"], difficulty: "MEDIUM", wordLengths: [4, 4] },
  { id: "light-house", clueWords: ["DARK", "CABIN"], difficulty: "MEDIUM", wordLengths: [5, 5] },
  {
    id: "silent-night",
    clueWords: ["NOISY", "EVENING"],
    difficulty: "MEDIUM",
    wordLengths: [6, 5],
  },
  { id: "ancient-history", clueWords: ["MODERN", "PAST"], difficulty: "HARD", wordLengths: [7, 7] },
  { id: "bitter-truth", clueWords: ["SWEET", "FACT"], difficulty: "HARD", wordLengths: [6, 5] },
  { id: "cold-shoulder", clueWords: ["WARM", "JOINT"], difficulty: "HARD", wordLengths: [4, 8] },
  { id: "freeze-frame", clueWords: ["MELT", "BORDER"], difficulty: "HARD", wordLengths: [6, 5] },
  { id: "dry-run", clueWords: ["WET", "SPRINT"], difficulty: "HARD", wordLengths: [3, 3] },
  { id: "prime-time", clueWords: ["CHOICE", "HOUR"], difficulty: "HARD", wordLengths: [5, 4] },
  { id: "short-circuit", clueWords: ["LONG", "TRACK"], difficulty: "HARD", wordLengths: [5, 7] },
];

export const PUBLIC_PUZZLES_BY_ID: ReadonlyMap<string, PublicPuzzleInfo> = new Map(
  PUBLIC_PUZZLE_METADATA.map((p) => [p.id, p])
);

/**
 * Counts actual available curated puzzles per difficulty tier using public metadata.
 * Safe for client bundles without leaking target solutions.
 */
export function getPuzzleCountsByDifficulty(): Record<Difficulty, number> {
  const counts: Record<Difficulty, number> = { EASY: 0, MEDIUM: 0, HARD: 0 };
  for (const puzzle of PUBLIC_PUZZLE_METADATA) {
    if (counts[puzzle.difficulty] !== undefined) {
      counts[puzzle.difficulty]++;
    }
  }
  return counts;
}
