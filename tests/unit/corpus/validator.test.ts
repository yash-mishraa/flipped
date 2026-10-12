import { describe, it, expect } from "vitest";
import { validateCandidate, validateCandidateCorpus } from "../../../scripts/corpus/validator";
import type { LexicalEntry, RawCandidate } from "../../../scripts/corpus/types";

describe("Corpus Validator — Quality Gates & Rejection Tracking", () => {
  const mockLexicon: Record<string, LexicalEntry> = {
    HOT: { lemma: "HOT", pos: "adj", zipfFrequency: 5.2, synonyms: ["WARM"], antonyms: ["COLD"] },
    COLD: { lemma: "COLD", pos: "adj", zipfFrequency: 5.1, synonyms: ["COOL"], antonyms: ["HOT"] },
    WATER: {
      lemma: "WATER",
      pos: "noun",
      zipfFrequency: 5.8,
      synonyms: ["SPRING"],
      antonyms: ["FIRE"],
    },
    SPRING: { lemma: "SPRING", pos: "noun", zipfFrequency: 5.0, synonyms: ["WATER"], antonyms: [] },
  };

  const createCandidate = (c1: string, c2: string, w1: string, w2: string): RawCandidate => ({
    id: `${c1.toLowerCase()}-${c2.toLowerCase()}-to-${w1.toLowerCase()}-${w2.toLowerCase()}`,
    clueWords: [c1, c2],
    answerWords: [w1, w2],
    transformations: [
      { clueWord: c1, answerWord: w1, relationship: "ANTONYM", explanation: "Opposite" },
      { clueWord: c2, answerWord: w2, relationship: "SYNONYM", explanation: "Synonym" },
    ],
    provenance: ["WordNet 3.1", "WordNet 3.1"],
    confidence: 0.9,
  });

  it("approves clean, valid candidates with high quality scores", () => {
    const candidate = createCandidate("COLD", "SPRING", "HOT", "WATER");
    const seen = new Set<string>();
    const result = validateCandidate(candidate, mockLexicon, seen);

    expect(result.status).toBe("APPROVED");
    expect(result.reasons).toHaveLength(0);
    expect(result.qualityScore).toBeGreaterThanOrEqual(80);
  });

  it("rejects profanity and explicit terms", () => {
    const candidate = createCandidate("DAMN", "WATER", "HOT", "SPRING");
    const seen = new Set<string>();
    const result = validateCandidate(candidate, mockLexicon, seen);

    expect(result.status).toBe("REJECTED");
    expect(result.reasons).toContain("PROFANITY_DETECTED");
  });

  it("rejects words that violate grid length bounds (<3 or >8 for answers, <3 or >9 for clues)", () => {
    // Answer word 2 letters (<3)
    const shortAns = createCandidate("COLD", "WATER", "HI", "SPRING");
    const res1 = validateCandidate(shortAns, mockLexicon, new Set());
    expect(res1.status).toBe("REJECTED");
    expect(res1.reasons).toContain("INVALID_WORD_LENGTH");

    // Answer word 9 letters (>8)
    const longAns = createCandidate("COLD", "WATER", "WONDERFUL", "SPRING");
    const res2 = validateCandidate(longAns, mockLexicon, new Set());
    expect(res2.status).toBe("REJECTED");
    expect(res2.reasons).toContain("INVALID_WORD_LENGTH");
  });

  it("rejects circular relationships where clue equals the answer or cross-matches", () => {
    const circular = createCandidate("HOT", "SPRING", "HOT", "WATER");
    const res = validateCandidate(circular, mockLexicon, new Set());
    expect(res.status).toBe("REJECTED");
    expect(res.reasons).toContain("CIRCULAR_RELATIONSHIP");

    const crossCircular = createCandidate("WATER", "SPRING", "HOT", "WATER");
    const resCross = validateCandidate(crossCircular, mockLexicon, new Set());
    expect(resCross.status).toBe("REJECTED");
    expect(resCross.reasons).toContain("CIRCULAR_RELATIONSHIP");
  });

  it("rejects identical clues", () => {
    const identical = createCandidate("COLD", "COLD", "HOT", "SPRING");
    const res = validateCandidate(identical, mockLexicon, new Set());
    expect(res.status).toBe("REJECTED");
    expect(res.reasons).toContain("IDENTICAL_CLUES");
  });

  it("flags borderline candidates for the review queue", () => {
    // Clue length 8 letters lowers quality score to review range
    const borderline = createCandidate("FREEZING", "FOUNTAIN", "HOT", "SPRING");
    const res = validateCandidate(borderline, mockLexicon, new Set());

    expect(res.status).toBe("REVIEW");
    expect(res.qualityScore).toBeLessThan(80);
    expect(res.qualityScore).toBeGreaterThanOrEqual(50);
    expect(res.reviewNotes).toBeDefined();
  });

  it("tallies rejection statistics across a full corpus batch", () => {
    const batch = [
      createCandidate("COLD", "SPRING", "HOT", "WATER"), // Valid
      createCandidate("DAMN", "SPRING", "HOT", "WATER"), // Profanity
      createCandidate("HOT", "SPRING", "HOT", "WATER"), // Circular
      createCandidate("COLD", "COLD", "HOT", "WATER"), // Identical
    ];

    const summary = validateCandidateCorpus(batch, mockLexicon);
    expect(summary.approved).toHaveLength(1);
    expect(summary.rejected).toHaveLength(3);
    expect(summary.rejectionStats.PROFANITY_DETECTED).toBe(1);
    expect(summary.rejectionStats.CIRCULAR_RELATIONSHIP).toBe(1);
    expect(summary.rejectionStats.IDENTICAL_CLUES).toBe(1);
  });
});
