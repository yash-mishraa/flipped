import type { AnswerCheckResult, LetterGrid, Puzzle } from "./types";
import { normalizeAnswerPair, normalizeAnswerPhrase, normalizeWord } from "./normalize-answer";

/**
 * Checks whether the player's entered words match the puzzle's canonical answer
 * or any approved variant.
 *
 * Designed to return structured evaluation without leaking the solution in user-facing messages.
 */
export function checkAnswer(
  puzzle: Puzzle,
  firstWordInput: string,
  secondWordInput: string
): AnswerCheckResult {
  const targetFirst = normalizeWord(puzzle.answerWords[0]);
  const targetSecond = normalizeWord(puzzle.answerWords[1]);
  const canonicalPhrase = `${targetFirst} ${targetSecond}`;

  const normFirst = normalizeWord(firstWordInput);
  const normSecond = normalizeWord(secondWordInput);
  const candidatePhrase = normalizeAnswerPair(normFirst, normSecond);

  // 1. Exact canonical match
  if (candidatePhrase === canonicalPhrase) {
    return {
      status: "CORRECT",
      isMatch: true,
      isVariantMatch: false,
      message: "Puzzle solved successfully!",
      details: {
        isFirstWordComplete: true,
        isSecondWordComplete: true,
        isFirstWordCorrect: true,
        isSecondWordCorrect: true,
      },
    };
  }

  // 2. Check approved variants
  if (Array.isArray(puzzle.approvedVariants) && puzzle.approvedVariants.length > 0) {
    const matchedVariant = puzzle.approvedVariants.some(
      (variant) => normalizeAnswerPhrase(variant) === candidatePhrase
    );

    if (matchedVariant) {
      return {
        status: "CORRECT",
        isMatch: true,
        isVariantMatch: true,
        message: "Puzzle solved successfully via approved variant!",
        details: {
          isFirstWordComplete: true,
          isSecondWordComplete: true,
          isFirstWordCorrect: true,
          isSecondWordCorrect: true,
        },
      };
    }
  }

  const isFirstWordComplete = normFirst.length >= targetFirst.length;
  const isSecondWordComplete = normSecond.length >= targetSecond.length;
  const isFirstWordCorrect = normFirst === targetFirst;
  const isSecondWordCorrect = normSecond === targetSecond;

  const details = {
    isFirstWordComplete,
    isSecondWordComplete,
    isFirstWordCorrect,
    isSecondWordCorrect,
  };

  // 3. Incomplete entries
  if (normFirst.length < targetFirst.length || normSecond.length < targetSecond.length) {
    return {
      status: "INCOMPLETE",
      isMatch: false,
      isVariantMatch: false,
      message: "Answer arrangement is incomplete.",
      details,
    };
  }

  // 4. Complete but incorrect
  return {
    status: "INCORRECT",
    isMatch: false,
    isVariantMatch: false,
    message: "Letter arrangement does not match the target phrase.",
    details,
  };
}

/**
 * Extracts entered words from a LetterGrid and evaluates them against the puzzle.
 */
export function checkGridAnswer(puzzle: Puzzle, grid: LetterGrid): AnswerCheckResult {
  const firstWord = grid.words[0].map((t) => t.letter).join("");
  const secondWord = grid.words[1].map((t) => t.letter).join("");

  return checkAnswer(puzzle, firstWord, secondWord);
}
