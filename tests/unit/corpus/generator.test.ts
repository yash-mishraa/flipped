import { describe, it, expect } from "vitest";
import { generateCandidatePuzzles } from "../../../scripts/corpus/generator";
import type { LexicalEntry } from "../../../scripts/corpus/types";

describe("Corpus Generator — Backwards Permutations & Synthesis", () => {
  const mockLexicon: Record<string, LexicalEntry> = {
    FAST: {
      lemma: "FAST",
      pos: "adj",
      zipfFrequency: 5.0,
      synonyms: ["QUICK", "SWIFT"],
      antonyms: ["SLOW"],
      definition: "Moving at high speed.",
    },
    FOOD: {
      lemma: "FOOD",
      pos: "noun",
      zipfFrequency: 5.2,
      synonyms: ["MEAL"],
      antonyms: ["POISON"],
      definition: "Nutritious substance.",
    },
  };

  const phrases: readonly [string, string][] = [["FAST", "FOOD"]];

  it("generates candidates across all 4 relationship permutations", () => {
    const candidates = generateCandidatePuzzles(phrases, mockLexicon);

    // Permutations:
    // SYN-SYN: (QUICK, MEAL), (SWIFT, MEAL) => 2
    // ANT-ANT: (SLOW, POISON) => 1
    // SYN-ANT: (QUICK, POISON), (SWIFT, POISON) => 2
    // ANT-SYN: (SLOW, MEAL) => 1
    // Total = 6 candidates
    expect(candidates).toHaveLength(6);

    const relCombos = candidates.map((c) => [
      c.transformations[0]?.relationship,
      c.transformations[1]?.relationship,
    ]);

    expect(relCombos).toContainEqual(["SYNONYM", "SYNONYM"]);
    expect(relCombos).toContainEqual(["ANTONYM", "ANTONYM"]);
    expect(relCombos).toContainEqual(["SYNONYM", "ANTONYM"]);
    expect(relCombos).toContainEqual(["ANTONYM", "SYNONYM"]);
  });

  it("strictly preserves clue-to-answer word order matching the phrase", () => {
    const candidates = generateCandidatePuzzles(phrases, mockLexicon);
    for (const c of candidates) {
      expect(c.answerWords).toEqual(["FAST", "FOOD"]);
      expect(c.transformations[0]?.answerWord).toBe("FAST");
      expect(c.transformations[1]?.answerWord).toBe("FOOD");
    }
  });

  it("generates natural explanation strings for each transformation", () => {
    const candidates = generateCandidatePuzzles(phrases, mockLexicon);
    const slowMeal = candidates.find((c) => c.clueWords[0] === "SLOW" && c.clueWords[1] === "MEAL");

    expect(slowMeal).toBeDefined();
    expect(slowMeal?.transformations[0]?.explanation).toBe("SLOW is the direct opposite of FAST.");
    expect(slowMeal?.transformations[1]?.explanation).toBe("MEAL is a standard synonym for FOOD.");
  });

  it("attaches source provenance and confidence", () => {
    const candidates = generateCandidatePuzzles(phrases, mockLexicon);
    for (const c of candidates) {
      expect(c.provenance).toEqual(["WordNet 3.1", "WordNet 3.1"]);
      expect(c.confidence).toBeGreaterThanOrEqual(0.9);
    }
  });

  it("safely ignores phrases with missing lexical entries without throwing", () => {
    const mixedPhrases: readonly [string, string][] = [
      ["UNKNOWN", "FOOD"],
      ["FAST", "MISSING"],
    ];
    const result = generateCandidatePuzzles(mixedPhrases, mockLexicon);
    expect(result).toHaveLength(0);
  });
});
