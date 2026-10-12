import type {
  LexicalEntry,
  RawCandidate,
  RejectionReason,
  ValidationResult,
  ValidationStatus,
} from "./types";

/**
 * Standard word-game family-friendly blocklist.
 * Ensures educational, suitable content for general audiences.
 */
const PROFANITY_BLOCKLIST = new Set([
  "DAMN",
  "HELL",
  "SHIT",
  "FUCK",
  "BASTARD",
  "BITCH",
  "CRAP",
  "ASS",
  "DICK",
  "COCK",
  "PISS",
  "SLUT",
  "WHORE",
]);

export interface ValidationSummary {
  readonly totalValidated: number;
  readonly approved: readonly RawCandidate[];
  readonly reviewQueue: readonly RawCandidate[];
  readonly rejected: readonly RawCandidate[];
  readonly rejectionStats: Record<RejectionReason, number>;
  readonly results: readonly ValidationResult[];
}

/**
 * Validates a single candidate against strict game rules, decency standards,
 * letter-length bounds, and lexical viability.
 */
export function validateCandidate(
  candidate: RawCandidate,
  lexicon: Record<string, LexicalEntry>,
  seenKeys: Set<string>
): ValidationResult {
  const [c1, c2] = candidate.clueWords;
  const [w1, w2] = candidate.answerWords;
  const reasons: RejectionReason[] = [];

  // 1. Profanity Check
  if (
    PROFANITY_BLOCKLIST.has(c1) ||
    PROFANITY_BLOCKLIST.has(c2) ||
    PROFANITY_BLOCKLIST.has(w1) ||
    PROFANITY_BLOCKLIST.has(w2)
  ) {
    reasons.push("PROFANITY_DETECTED");
  }

  // 2. Alphabetic check
  const isAlpha = (w: string) => /^[A-Z]+$/.test(w);
  if (!isAlpha(c1) || !isAlpha(c2) || !isAlpha(w1) || !isAlpha(w2)) {
    reasons.push("INVALID_WORD_LENGTH");
  }

  // 3. Length Constraints
  // Answer words: 3 to 8 characters (as defined in game engine and grid rules)
  if (w1.length < 3 || w1.length > 8 || w2.length < 3 || w2.length > 8) {
    reasons.push("INVALID_WORD_LENGTH");
  }

  // Clue words: 3 to 9 characters
  if (c1.length < 3 || c1.length > 9 || c2.length < 3 || c2.length > 9) {
    reasons.push("INVALID_WORD_LENGTH");
  }

  // 4. Circular Clues: clue cannot equal its corresponding answer
  if (c1 === w1 || c2 === w2) {
    reasons.push("CIRCULAR_RELATIONSHIP");
  }

  // 5. Cross-Circularity: clue cannot cross-match other answer
  if (c1 === w2 || c2 === w1) {
    reasons.push("CIRCULAR_RELATIONSHIP");
  }

  // 6. Identical clues
  if (c1 === c2) {
    reasons.push("IDENTICAL_CLUES");
  }

  // 7. Check for Empty Transformations
  if (
    !candidate.transformations ||
    candidate.transformations.length < 2 ||
    !candidate.transformations[0]?.explanation ||
    !candidate.transformations[1]?.explanation
  ) {
    reasons.push("EMPTY_TRANSFORMATION");
  }

  // 8. Deduplication check: unique clue+answer quartet
  const dedupKey = `${c1}_${c2}_${w1}_${w2}`;
  if (seenKeys.has(dedupKey)) {
    reasons.push("DUPLICATE_PUZZLE_ID");
  }

  // 9. Vocabulary familiarity & Zipf checks
  const eC1 = lexicon[c1];
  const eC2 = lexicon[c2];
  const eW1 = lexicon[w1];
  const eW2 = lexicon[w2];

  const zipfC1 = eC1?.zipfFrequency ?? 3.8;
  const zipfC2 = eC2?.zipfFrequency ?? 3.8;
  const zipfW1 = eW1?.zipfFrequency ?? 4.5;
  const zipfW2 = eW2?.zipfFrequency ?? 4.5;

  if (zipfC1 < 2.5 || zipfC2 < 2.5) {
    reasons.push("OBSCURE_VOCABULARY");
  }

  // Calculate quality score: 0 to 100
  let qualityScore = 100;
  if (c1.length >= 8) qualityScore -= 12;
  if (c2.length >= 8) qualityScore -= 12;
  if (zipfC1 < 4.2) qualityScore -= 12;
  if (zipfC2 < 4.2) qualityScore -= 12;
  if (zipfW1 < 4.2) qualityScore -= 6;
  if (zipfW2 < 4.2) qualityScore -= 6;

  // Double antonyms carry higher potential semantic ambiguity
  if (
    candidate.transformations[0]?.relationship === "ANTONYM" &&
    candidate.transformations[1]?.relationship === "ANTONYM"
  ) {
    qualityScore -= 6;
  }

  qualityScore = Math.max(0, Math.min(100, qualityScore));

  let status: ValidationStatus;
  let reviewNotes: string | undefined;

  if (reasons.length > 0) {
    status = "REJECTED";
  } else if (qualityScore >= 80) {
    status = "APPROVED";
    seenKeys.add(dedupKey);
  } else if (qualityScore >= 50) {
    status = "REVIEW";
    reviewNotes = `Borderline candidate (Quality Score: ${qualityScore}). Clues: ${c1} / ${c2}, Answers: ${w1} / ${w2} (Zipf: ${zipfC1.toFixed(1)} / ${zipfC2.toFixed(1)}).`;
    seenKeys.add(dedupKey);
  } else {
    status = "REJECTED";
    reasons.push("LOW_CONFIDENCE");
  }

  return {
    candidate,
    status,
    reasons,
    qualityScore,
    reviewNotes,
  };
}

/**
 * Validates an entire collection of raw candidates and tallies comprehensive
 * quality rejection metrics.
 */
export function validateCandidateCorpus(
  candidates: readonly RawCandidate[],
  lexicon: Record<string, LexicalEntry>
): ValidationSummary {
  const seenKeys = new Set<string>();
  const results: ValidationResult[] = [];
  const approved: RawCandidate[] = [];
  const reviewQueue: RawCandidate[] = [];
  const rejected: RawCandidate[] = [];

  const rejectionStats: Record<RejectionReason, number> = {
    PROFANITY_DETECTED: 0,
    INVALID_WORD_LENGTH: 0,
    CIRCULAR_RELATIONSHIP: 0,
    IDENTICAL_CLUES: 0,
    OBSCURE_VOCABULARY: 0,
    DUPLICATE_PUZZLE_ID: 0,
    LOW_CONFIDENCE: 0,
    AMBIGUOUS_CLUES: 0,
    EMPTY_TRANSFORMATION: 0,
  };

  for (const candidate of candidates) {
    const result = validateCandidate(candidate, lexicon, seenKeys);
    results.push(result);

    if (result.status === "APPROVED") {
      approved.push(candidate);
    } else if (result.status === "REVIEW") {
      reviewQueue.push(candidate);
    } else {
      rejected.push(candidate);
      for (const reason of result.reasons) {
        rejectionStats[reason]++;
      }
    }
  }

  return {
    totalValidated: candidates.length,
    approved,
    reviewQueue,
    rejected,
    rejectionStats,
    results,
  };
}
