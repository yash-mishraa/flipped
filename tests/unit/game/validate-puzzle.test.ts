import { describe, it, expect } from "vitest";
import { validatePuzzle, validatePuzzleCollection } from "@/features/game/domain/validate-puzzle";
import { TEST_PUZZLES } from "@/features/game/data/test-puzzles";
import type { Difficulty, Puzzle, RelationshipType } from "@/features/game/domain/types";

describe("Semantic Puzzle Validator", () => {
  const validPuzzle: Puzzle = {
    id: "puzzle-sample",
    clueWords: ["SLOW", "MEAL"],
    answerWords: ["FAST", "FOOD"],
    transformations: [
      {
        clueWord: "SLOW",
        answerWord: "FAST",
        relationship: "ANTONYM",
        explanation: "Fast is the opposite of slow.",
      },
      {
        clueWord: "MEAL",
        answerWord: "FOOD",
        relationship: "SYNONYM",
        explanation: "Food is a synonym for meal.",
      },
    ],
    difficulty: "EASY",
    approvedVariants: ["QUICK BITE"],
  };

  it("validates a structurally sound puzzle with zero errors", () => {
    const errors = validatePuzzle(validPuzzle);
    expect(errors).toHaveLength(0);
  });

  it("fails when puzzle is not an object or is null", () => {
    const errorsNull = validatePuzzle(null);
    expect(errorsNull.length).toBeGreaterThan(0);
    expect(errorsNull[0]?.message).toContain("valid non-null object");

    const errorsUndefined = validatePuzzle(undefined);
    expect(errorsUndefined.length).toBeGreaterThan(0);
  });

  it("flags missing or whitespace-only puzzle ID", () => {
    const invalid = { ...validPuzzle, id: "   " };
    const errors = validatePuzzle(invalid);
    expect(errors.some((e) => e.field === "id")).toBe(true);
  });

  it("flags missing clue words", () => {
    const invalid = { ...validPuzzle, clueWords: ["SLOW"] };
    const errors = validatePuzzle(invalid);
    expect(errors.some((e) => e.field === "clueWords")).toBe(true);
  });

  it("flags missing answer words", () => {
    const invalid = { ...validPuzzle, answerWords: ["FAST", ""] };
    const errors = validatePuzzle(invalid);
    expect(errors.some((e) => e.field === "answerWords[1]")).toBe(true);
  });

  it("flags invalid relationship types in transformations", () => {
    const invalid = {
      ...validPuzzle,
      transformations: [
        {
          clueWord: "SLOW",
          answerWord: "FAST",
          relationship: "ASSOCIATION" as unknown as RelationshipType,
          explanation: "Valid explanation here.",
        },
        validPuzzle.transformations[1]!,
      ],
    };
    const errors = validatePuzzle(invalid);
    expect(errors.some((e) => e.field.includes("relationship"))).toBe(true);
  });

  it("flags mismatch between clueWords and transformation clueWord", () => {
    const invalid = {
      ...validPuzzle,
      transformations: [
        {
          clueWord: "DIFFERENT",
          answerWord: "FAST",
          relationship: "ANTONYM" as const,
          explanation: "Valid explanation.",
        },
        validPuzzle.transformations[1]!,
      ],
    };
    const errors = validatePuzzle(invalid);
    expect(errors.some((e) => e.field.includes("clueWord"))).toBe(true);
  });

  it("flags mismatch between answerWords and transformation answerWord", () => {
    const invalid = {
      ...validPuzzle,
      transformations: [
        validPuzzle.transformations[0]!,
        {
          clueWord: "MEAL",
          answerWord: "SNACK",
          relationship: "SYNONYM" as const,
          explanation: "Valid explanation.",
        },
      ],
    };
    const errors = validatePuzzle(invalid);
    expect(errors.some((e) => e.field.includes("answerWord"))).toBe(true);
  });

  it("flags missing or overly brief explanations", () => {
    const invalid = {
      ...validPuzzle,
      transformations: [
        {
          ...validPuzzle.transformations[0]!,
          explanation: "no",
        },
        validPuzzle.transformations[1]!,
      ],
    };
    const errors = validatePuzzle(invalid);
    expect(errors.some((e) => e.field.includes("explanation"))).toBe(true);
  });

  it("flags invalid difficulty tier", () => {
    const invalid = { ...validPuzzle, difficulty: "EXPERT" as unknown as Difficulty };
    const errors = validatePuzzle(invalid);
    expect(errors.some((e) => e.field === "difficulty")).toBe(true);
  });

  it("detects duplicate approved variants", () => {
    const invalid = {
      ...validPuzzle,
      approvedVariants: ["FAST-FOOD", "Fast Food"],
    };
    const errors = validatePuzzle(invalid);
    expect(errors.some((e) => e.field.includes("approvedVariants"))).toBe(true);
  });

  it("flags approved variant that contradicts two-word structure", () => {
    const invalid = {
      ...validPuzzle,
      approvedVariants: ["JUSTONEWORD"],
    };
    const errors = validatePuzzle(invalid);
    expect(errors.some((e) => e.field.includes("approvedVariants"))).toBe(true);
  });

  it("flags approved variant duplicating canonical answer phrase", () => {
    const invalid = {
      ...validPuzzle,
      approvedVariants: ["FAST FOOD"],
    };
    const errors = validatePuzzle(invalid);
    expect(errors.some((e) => e.message.includes("matches the canonical answer phrase"))).toBe(
      true
    );
  });

  describe("Collection Validation", () => {
    it("flags duplicate puzzle IDs across a collection", () => {
      const duplicateCollection = [validPuzzle, { ...validPuzzle, difficulty: "HARD" as const }];
      const report = validatePuzzleCollection(duplicateCollection);
      expect(report.isValid).toBe(false);
      expect(report.errors.some((e) => e.message.includes("Duplicate puzzle ID"))).toBe(true);
    });

    it("verifies the entire curated TEST_PUZZLES fixture set passes validation with zero errors", () => {
      const report = validatePuzzleCollection(TEST_PUZZLES);
      expect(report.isValid).toBe(true);
      expect(report.totalValidated).toBe(TEST_PUZZLES.length);
      expect(report.errors).toHaveLength(0);
    });
  });
});
