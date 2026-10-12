import type { Puzzle } from "../domain/types";
import masterCorpusJson from "./puzzles-corpus.json";

/**
 * Curated master puzzle collection for Flipped.
 * Contains rigorously verified phrase transformations covering Easy, Medium, and Hard tiers.
 * Starts with the 20 legacy curated puzzles (indices 0-19) followed by the validated corpus puzzles.
 */
export const CURATED_PUZZLES: readonly Puzzle[] = masterCorpusJson as unknown as readonly Puzzle[];

/**
 * Fast lookup map for curated puzzles by ID.
 */
export const PUZZLES_BY_ID: ReadonlyMap<string, Puzzle> = new Map(
  CURATED_PUZZLES.map((puzzle) => [puzzle.id, puzzle])
);
