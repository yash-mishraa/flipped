import { describe, it, expect } from "vitest";
import { calculateCandidateDifficulty } from "../../../scripts/corpus/difficulty";
import type { LexicalEntry, RawCandidate } from "../../../scripts/corpus/types";

describe("Corpus Difficulty Engine — Multi-Factor Scoring & Calibration", () => {
  const mockLexicon: Record<string, LexicalEntry> = {
    // High frequency common words (Zipf > 5.0)
    DAY: { lemma: "DAY", pos: "noun", zipfFrequency: 5.6, synonyms: [], antonyms: ["NIGHT"] },
    NIGHT: { lemma: "NIGHT", pos: "noun", zipfFrequency: 5.5, synonyms: [], antonyms: ["DAY"] },
    HOT: { lemma: "HOT", pos: "adj", zipfFrequency: 5.3, synonyms: ["WARM"], antonyms: ["COLD"] },
    COLD: { lemma: "COLD", pos: "adj", zipfFrequency: 5.2, synonyms: ["COOL"], antonyms: ["HOT"] },
    WARM: { lemma: "WARM", pos: "adj", zipfFrequency: 5.0, synonyms: ["HOT"], antonyms: ["COOL"] },
    FOOD: { lemma: "FOOD", pos: "noun", zipfFrequency: 5.3, synonyms: ["MEAL"], antonyms: [] },
    MEAL: { lemma: "MEAL", pos: "noun", zipfFrequency: 5.0, synonyms: ["FOOD"], antonyms: [] },
    // Lower frequency / longer words (Zipf 3.8 - 4.5)
    ANCIENT: {
      lemma: "ANCIENT",
      pos: "adj",
      zipfFrequency: 4.2,
      synonyms: ["ANTIQUE"],
      antonyms: ["MODERN"],
    },
    MODERN: {
      lemma: "MODERN",
      pos: "adj",
      zipfFrequency: 4.8,
      synonyms: [],
      antonyms: ["ANCIENT"],
    },
    HISTORY: {
      lemma: "HISTORY",
      pos: "noun",
      zipfFrequency: 4.9,
      synonyms: ["PAST"],
      antonyms: [],
    },
    PAST: { lemma: "PAST", pos: "noun", zipfFrequency: 5.1, synonyms: ["HISTORY"], antonyms: [] },
  };

  it("classifies short, common words with high Zipf frequency as EASY", () => {
    const candidate: RawCandidate = {
      id: "warm-meal-to-hot-food",
      clueWords: ["WARM", "MEAL"],
      answerWords: ["HOT", "FOOD"],
      transformations: [
        { clueWord: "WARM", answerWord: "HOT", relationship: "SYNONYM", explanation: "Syn" },
        { clueWord: "MEAL", answerWord: "FOOD", relationship: "SYNONYM", explanation: "Syn" },
      ],
      provenance: ["WordNet 3.1", "WordNet 3.1"],
      confidence: 0.9,
    };

    const breakdown = calculateCandidateDifficulty(candidate, mockLexicon);
    expect(breakdown.tier).toBe("EASY");
    expect(breakdown.score).toBeLessThan(53.0);
    expect(breakdown.antonymCount).toBe(0);
    expect(breakdown.reasoning).toContain("High familiarity");
  });

  it("increases score for single antonym inversions (MEDIUM tier)", () => {
    const candidate: RawCandidate = {
      id: "cold-meal-to-hot-food",
      clueWords: ["COLD", "MEAL"],
      answerWords: ["HOT", "FOOD"],
      transformations: [
        { clueWord: "COLD", answerWord: "HOT", relationship: "ANTONYM", explanation: "Opposite" },
        { clueWord: "MEAL", answerWord: "FOOD", relationship: "SYNONYM", explanation: "Syn" },
      ],
      provenance: ["WordNet 3.1", "WordNet 3.1"],
      confidence: 0.9,
    };

    const breakdown = calculateCandidateDifficulty(candidate, mockLexicon);
    expect(breakdown.antonymCount).toBe(1);
    expect(breakdown.score).toBeGreaterThanOrEqual(40.0);
  });

  it("classifies double antonym inversions with longer words into HARD tier", () => {
    const candidate: RawCandidate = {
      id: "modern-future-to-ancient-past",
      clueWords: ["MODERN", "NIGHT"],
      answerWords: ["ANCIENT", "DAY"],
      transformations: [
        {
          clueWord: "MODERN",
          answerWord: "ANCIENT",
          relationship: "ANTONYM",
          explanation: "Opposite",
        },
        { clueWord: "NIGHT", answerWord: "DAY", relationship: "ANTONYM", explanation: "Opposite" },
      ],
      provenance: ["WordNet 3.1", "WordNet 3.1"],
      confidence: 0.9,
    };

    const breakdown = calculateCandidateDifficulty(candidate, mockLexicon);
    expect(breakdown.tier).toBe("HARD");
    expect(breakdown.score).toBeGreaterThanOrEqual(69.0);
    expect(breakdown.antonymCount).toBe(2);
  });

  it("strictly bounds difficulty scores within [5, 95]", () => {
    const dummyCandidate: RawCandidate = {
      id: "test-puzzle",
      clueWords: ["COLD", "FOOD"],
      answerWords: ["HOT", "MEAL"],
      transformations: [
        { clueWord: "COLD", answerWord: "HOT", relationship: "ANTONYM", explanation: "Opposite" },
        { clueWord: "FOOD", answerWord: "MEAL", relationship: "SYNONYM", explanation: "Syn" },
      ],
      provenance: ["WordNet 3.1", "WordNet 3.1"],
      confidence: 0.9,
    };

    const breakdown = calculateCandidateDifficulty(dummyCandidate, mockLexicon);
    expect(breakdown.score).toBeGreaterThanOrEqual(5.0);
    expect(breakdown.score).toBeLessThanOrEqual(95.0);
  });
});
