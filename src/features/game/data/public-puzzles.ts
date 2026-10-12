import type { Difficulty } from "../domain/types";
import publicMetadataJson from "./public-puzzles.json";

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
export const PUBLIC_PUZZLE_METADATA: readonly PublicPuzzleInfo[] =
  publicMetadataJson as unknown as readonly PublicPuzzleInfo[];

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
