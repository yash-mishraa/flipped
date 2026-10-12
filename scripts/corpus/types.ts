import type {
  Difficulty,
  RelationshipType,
  WordTransformation,
  Puzzle,
} from "../../src/features/game/domain/types";

export type { Difficulty, RelationshipType, WordTransformation, Puzzle };

export type ValidationStatus = "APPROVED" | "REVIEW" | "REJECTED";

export type RejectionReason =
  | "PROFANITY_DETECTED"
  | "INVALID_WORD_LENGTH"
  | "CIRCULAR_RELATIONSHIP"
  | "IDENTICAL_CLUES"
  | "OBSCURE_VOCABULARY"
  | "DUPLICATE_PUZZLE_ID"
  | "LOW_CONFIDENCE"
  | "AMBIGUOUS_CLUES"
  | "EMPTY_TRANSFORMATION";

export interface LexicalRelation {
  readonly word: string;
  readonly relationship: RelationshipType;
  readonly sense?: string;
  readonly confidence: number;
  readonly source: string;
  readonly explanation: string;
}

export interface LexicalEntry {
  readonly lemma: string;
  readonly pos: "noun" | "adj" | "verb" | "adv";
  readonly zipfFrequency: number;
  readonly synonyms: readonly string[];
  readonly antonyms: readonly string[];
  readonly definition?: string;
}

export interface RawCandidate {
  readonly id: string;
  readonly clueWords: readonly [string, string];
  readonly answerWords: readonly [string, string];
  readonly transformations: readonly [WordTransformation, WordTransformation];
  readonly provenance: readonly [string, string];
  readonly confidence: number;
}

export interface ValidationResult {
  readonly candidate: RawCandidate;
  readonly status: ValidationStatus;
  readonly reasons: readonly RejectionReason[];
  readonly qualityScore: number;
  readonly reviewNotes?: string;
}

export interface DifficultyScoreBreakdown {
  readonly score: number; // 0 to 100
  readonly tier: Difficulty;
  readonly clueFrequencyAvg: number;
  readonly answerFrequencyAvg: number;
  readonly antonymCount: number;
  readonly wordLengthSum: number;
  readonly polysemyPenalty: number;
  readonly reasoning: string;
}

export interface CorpusStats {
  readonly totalPhrasesInput: number;
  readonly totalCandidatesGenerated: number;
  readonly totalRejected: number;
  readonly rejectionBreakdown: Record<string, number>;
  readonly totalReviewQueue: number;
  readonly totalApproved: number;
  readonly difficultyDistribution: {
    readonly EASY: number;
    readonly MEDIUM: number;
    readonly HARD: number;
  };
  readonly relationshipDistribution: {
    readonly SYNONYM_SYNONYM: number;
    readonly ANTONYM_ANTONYM: number;
    readonly SYNONYM_ANTONYM: number;
    readonly ANTONYM_SYNONYM: number;
  };
  readonly generatedAt: string;
  readonly version: string;
}
