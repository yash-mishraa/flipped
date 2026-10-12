import type { LexicalEntry, RawCandidate, WordTransformation } from "./types";

/**
 * Deterministic backwards puzzle candidate generator.
 * Takes valid two-word phrases and synthesizes all 4 clue relationship permutations:
 * - (SYNONYM, SYNONYM)
 * - (ANTONYM, ANTONYM)
 * - (SYNONYM, ANTONYM)
 * - (ANTONYM, SYNONYM)
 */
export function generateCandidatePuzzles(
  phrases: readonly (readonly [string, string])[],
  lexicon: Record<string, LexicalEntry>
): RawCandidate[] {
  const candidates: RawCandidate[] = [];

  for (const [rawW1, rawW2] of phrases) {
    const w1 = rawW1.trim().toUpperCase();
    const w2 = rawW2.trim().toUpperCase();

    const entry1 = lexicon[w1];
    const entry2 = lexicon[w2];

    if (!entry1 || !entry2) {
      continue;
    }

    const syns1 = entry1.synonyms.map((s) => s.trim().toUpperCase()).filter(Boolean);
    const ants1 = entry1.antonyms.map((a) => a.trim().toUpperCase()).filter(Boolean);
    const syns2 = entry2.synonyms.map((s) => s.trim().toUpperCase()).filter(Boolean);
    const ants2 = entry2.antonyms.map((a) => a.trim().toUpperCase()).filter(Boolean);

    // Permutation groups:
    const permutations: Array<{
      rel1: "SYNONYM" | "ANTONYM";
      rel2: "SYNONYM" | "ANTONYM";
      clues1: string[];
      clues2: string[];
    }> = [
      { rel1: "SYNONYM", rel2: "SYNONYM", clues1: syns1, clues2: syns2 },
      { rel1: "ANTONYM", rel2: "ANTONYM", clues1: ants1, clues2: ants2 },
      { rel1: "SYNONYM", rel2: "ANTONYM", clues1: syns1, clues2: ants2 },
      { rel1: "ANTONYM", rel2: "SYNONYM", clues1: ants1, clues2: syns2 },
    ];

    for (const perm of permutations) {
      for (const clue1 of perm.clues1) {
        for (const clue2 of perm.clues2) {
          const trans1: WordTransformation = {
            clueWord: clue1,
            answerWord: w1,
            relationship: perm.rel1,
            explanation:
              perm.rel1 === "SYNONYM"
                ? `${clue1} is a standard synonym for ${w1}.`
                : `${clue1} is the direct opposite of ${w1}.`,
          };

          const trans2: WordTransformation = {
            clueWord: clue2,
            answerWord: w2,
            relationship: perm.rel2,
            explanation:
              perm.rel2 === "SYNONYM"
                ? `${clue2} is a standard synonym for ${w2}.`
                : `${clue2} is the direct opposite of ${w2}.`,
          };

          const id = `${clue1.toLowerCase()}-${clue2.toLowerCase()}-to-${w1.toLowerCase()}-${w2.toLowerCase()}`;

          candidates.push({
            id,
            clueWords: [clue1, clue2],
            answerWords: [w1, w2],
            transformations: [trans1, trans2],
            provenance: ["WordNet 3.1", "WordNet 3.1"],
            confidence: perm.rel1 === "ANTONYM" && perm.rel2 === "ANTONYM" ? 0.93 : 0.9,
          });
        }
      }
    }
  }

  return candidates;
}
