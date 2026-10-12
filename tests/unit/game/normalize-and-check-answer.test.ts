import { describe, it, expect } from "vitest";
import {
  areAnswersEquivalent,
  normalizeAnswerPair,
  normalizeAnswerPhrase,
  normalizeWord,
  splitNormalizedPhrase,
} from "@/features/game/domain/normalize-answer";
import { checkAnswer } from "@/features/game/domain/check-answer";
import { TEST_PUZZLES } from "@/features/game/data/test-puzzles";

describe("Answer Normalization & Semantic Answer Checking", () => {
  const fastFoodPuzzle = TEST_PUZZLES[0]!; // SLOW + MEAL -> FAST FOOD, approved variant: QUICK BITE

  describe("Word Normalization (normalizeWord)", () => {
    it("converts lowercase letters to uppercase", () => {
      expect(normalizeWord("fast")).toBe("FAST");
      expect(normalizeWord("Food")).toBe("FOOD");
    });

    it("trims surrounding whitespace", () => {
      expect(normalizeWord("   fast   ")).toBe("FAST");
    });

    it("strips non-alphabetic characters and punctuation", () => {
      expect(normalizeWord("f-a-s-t!")).toBe("FAST");
      expect(normalizeWord("f00d")).toBe("FD");
    });

    it("returns empty string for invalid non-string inputs", () => {
      expect(normalizeWord("" as unknown as string)).toBe("");
      expect(normalizeWord(null as unknown as string)).toBe("");
      expect(normalizeWord(undefined as unknown as string)).toBe("");
    });
  });

  describe("Phrase Normalization (normalizeAnswerPhrase)", () => {
    it("normalizes casing, whitespace, and collapses multi-spaces", () => {
      expect(normalizeAnswerPhrase("fast food")).toBe("FAST FOOD");
      expect(normalizeAnswerPhrase("  Fast    Food  ")).toBe("FAST FOOD");
      expect(normalizeAnswerPhrase("FAST   FOOD")).toBe("FAST FOOD");
    });

    it("replaces hyphens and underscores with single spaces", () => {
      expect(normalizeAnswerPhrase("fast-food")).toBe("FAST FOOD");
      expect(normalizeAnswerPhrase("fast_food")).toBe("FAST FOOD");
      expect(normalizeAnswerPhrase("fast---food")).toBe("FAST FOOD");
    });

    it("strips punctuation from phrases while keeping inner word separation", () => {
      expect(normalizeAnswerPhrase("!fast, food?")).toBe("FAST FOOD");
    });

    it("returns empty string for empty or non-string inputs", () => {
      expect(normalizeAnswerPhrase("")).toBe("");
      expect(normalizeAnswerPhrase(null as unknown as string)).toBe("");
    });
  });

  describe("Pair Normalization & Splitting", () => {
    it("combines two valid words into canonical phrase", () => {
      expect(normalizeAnswerPair("fast", "food")).toBe("FAST FOOD");
      expect(normalizeAnswerPair("  war ", " cry  ")).toBe("WAR CRY");
    });

    it("returns empty string if either word is invalid", () => {
      expect(normalizeAnswerPair("", "food")).toBe("");
      expect(normalizeAnswerPair("fast", "")).toBe("");
    });

    it("splits normalized two-word phrase into word tuple", () => {
      const split = splitNormalizedPhrase("fast food");
      expect(split).toEqual(["FAST", "FOOD"]);
    });

    it("rejects phrases with more or fewer than two words", () => {
      expect(splitNormalizedPhrase("single")).toBeNull();
      expect(splitNormalizedPhrase("one two three")).toBeNull();
      expect(splitNormalizedPhrase("")).toBeNull();
    });

    it("evaluates semantic equivalence between phrases", () => {
      expect(areAnswersEquivalent("fast food", "FAST-FOOD")).toBe(true);
      expect(areAnswersEquivalent("  Fast   Food ", "FAST FOOD")).toBe(true);
      expect(areAnswersEquivalent("fast food", "slow meal")).toBe(false);
    });
  });

  describe("Exact Answer Checking (checkAnswer)", () => {
    it("accepts exact canonical answer with case and whitespace tolerance", () => {
      const resultUpper = checkAnswer(fastFoodPuzzle, "FAST", "FOOD");
      expect(resultUpper.status).toBe("CORRECT");
      expect(resultUpper.isMatch).toBe(true);
      expect(resultUpper.isVariantMatch).toBe(false);

      const resultLower = checkAnswer(fastFoodPuzzle, "fast", "food");
      expect(resultLower.status).toBe("CORRECT");
      expect(resultLower.isMatch).toBe(true);

      const resultPadded = checkAnswer(fastFoodPuzzle, "  fast  ", "  food ");
      expect(resultPadded.status).toBe("CORRECT");
      expect(resultPadded.isMatch).toBe(true);
    });

    it("accepts explicitly approved variants with isVariantMatch=true", () => {
      const resultVariant = checkAnswer(fastFoodPuzzle, "QUICK", "BITE");
      expect(resultVariant.status).toBe("CORRECT");
      expect(resultVariant.isMatch).toBe(true);
      expect(resultVariant.isVariantMatch).toBe(true);
    });

    it("rejects incomplete entries and reports INCOMPLETE status", () => {
      const partial1 = checkAnswer(fastFoodPuzzle, "FAS", "FOOD");
      expect(partial1.status).toBe("INCOMPLETE");
      expect(partial1.isMatch).toBe(false);
      expect(partial1.details.isFirstWordComplete).toBe(false);
      expect(partial1.details.isSecondWordComplete).toBe(true);

      const partial2 = checkAnswer(fastFoodPuzzle, "FAST", "");
      expect(partial2.status).toBe("INCOMPLETE");
      expect(partial2.details.isSecondWordComplete).toBe(false);

      const empty = checkAnswer(fastFoodPuzzle, "", "");
      expect(empty.status).toBe("INCOMPLETE");
    });

    it("rejects complete but incorrect answers", () => {
      const wrong = checkAnswer(fastFoodPuzzle, "SLOW", "MEAL"); // Clue words!
      expect(wrong.status).toBe("INCORRECT");
      expect(wrong.isMatch).toBe(false);
      expect(wrong.details.isFirstWordComplete).toBe(true);
      expect(wrong.details.isSecondWordComplete).toBe(true);
      expect(wrong.details.isFirstWordCorrect).toBe(false);
      expect(wrong.details.isSecondWordCorrect).toBe(false);
    });

    it("rejects reversed word order", () => {
      const reversed = checkAnswer(fastFoodPuzzle, "FOOD", "FAST");
      expect(reversed.status).toBe("INCORRECT");
      expect(reversed.isMatch).toBe(false);
    });

    it("rejects answers where second word is incorrect", () => {
      const halfRight = checkAnswer(fastFoodPuzzle, "FAST", "FEET");
      expect(halfRight.status).toBe("INCORRECT");
      expect(halfRight.isMatch).toBe(false);
      expect(halfRight.details.isFirstWordCorrect).toBe(true);
      expect(halfRight.details.isSecondWordCorrect).toBe(false);
    });

    it("rejects substring false positives", () => {
      const substring = checkAnswer(fastFoodPuzzle, "FA", "FO");
      expect(substring.status).toBe("INCOMPLETE");
      expect(substring.isMatch).toBe(false);
    });

    it("never exposes the target solution words in active user messages", () => {
      const wrong = checkAnswer(fastFoodPuzzle, "ZZZZ", "YYYY");
      expect(wrong.message).not.toContain("FAST");
      expect(wrong.message).not.toContain("FOOD");

      const partial = checkAnswer(fastFoodPuzzle, "FAS", "FOO");
      expect(partial.message).not.toContain("FAST");
      expect(partial.message).not.toContain("FOOD");
    });
  });
});
