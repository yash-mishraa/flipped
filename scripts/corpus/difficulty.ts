import type { Difficulty } from "../../src/features/game/domain/types";
import type { DifficultyScoreBreakdown, LexicalEntry, RawCandidate } from "./types";

/**
 * Computes a multi-factor difficulty score based on:
 * 1. Word familiarity (SUBTLEX-US logarithmic Zipf frequency)
 * 2. Relationship cognitive load (antonyms require cognitive semantic inversion vs. direct synonyms)
 * 3. Word length constraints (longer words take longer to deduce on the letter grid)
 * 4. Polysemy and clue directness
 */
export function calculateCandidateDifficulty(
  candidate: RawCandidate,
  lexicon: Record<string, LexicalEntry>
): DifficultyScoreBreakdown {
  const [c1, c2] = candidate.clueWords;
  const [w1, w2] = candidate.answerWords;
  const [t1, t2] = candidate.transformations;

  const eC1 = lexicon[c1];
  const eC2 = lexicon[c2];
  const eW1 = lexicon[w1];
  const eW2 = lexicon[w2];

  const zipfC1 = eC1?.zipfFrequency ?? 4.0;
  const zipfC2 = eC2?.zipfFrequency ?? 4.0;
  const zipfW1 = eW1?.zipfFrequency ?? 4.8;
  const zipfW2 = eW2?.zipfFrequency ?? 4.8;

  const clueFrequencyAvg = (zipfC1 + zipfC2) / 2.0;
  const answerFrequencyAvg = (zipfW1 + zipfW2) / 2.0;

  // 1. Antonym cognitive load
  const isAnt1 = t1.relationship === "ANTONYM";
  const isAnt2 = t2.relationship === "ANTONYM";
  const antonymCount = (isAnt1 ? 1 : 0) + (isAnt2 ? 1 : 0);
  const relLoad = antonymCount * 12.0; // 0, 12, or 24 points

  // 2. Length factor: total letters across clue and answer words
  const wordLengthSum = w1.length + w2.length + c1.length + c2.length;
  const lenFactor = (wordLengthSum - 14) * 2.0;

  // 3. Frequency difficulty: lower Zipf score = harder vocabulary
  const freqDiff =
    Math.max(0, 5.5 - clueFrequencyAvg) * 12.0 + Math.max(0, 5.5 - answerFrequencyAvg) * 8.0;

  // 4. Polysemy penalty: multiple senses or definitions
  const polysemyPenalty = c1.length > 7 || c2.length > 7 ? 4.0 : 0.0;

  const rawScore = 25.0 + relLoad + lenFactor + freqDiff + polysemyPenalty;
  const score = Math.max(5.0, Math.min(95.0, Math.round(rawScore * 10) / 10));

  let tier: Difficulty;
  let reasoning: string;

  if (score < 53.0) {
    tier = "EASY";
    reasoning = `High familiarity (Zipf clues: ${clueFrequencyAvg.toFixed(1)}, ans: ${answerFrequencyAvg.toFixed(1)}), ${antonymCount} antonyms, short word lengths.`;
  } else if (score < 69.0) {
    tier = "MEDIUM";
    reasoning = `Moderate vocabulary familiarity with ${antonymCount} cognitive inversions and standard grid word lengths.`;
  } else {
    tier = "HARD";
    reasoning = `Advanced vocabulary or double antonym inversions requiring higher deductive reasoning.`;
  }

  return {
    score,
    tier,
    clueFrequencyAvg,
    answerFrequencyAvg,
    antonymCount,
    wordLengthSum,
    polysemyPenalty,
    reasoning,
  };
}
