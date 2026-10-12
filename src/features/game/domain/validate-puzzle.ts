import type {
  Difficulty,
  Puzzle,
  PuzzleValidationError,
  PuzzleValidationReport,
  RelationshipType,
} from "./types";
import {
  normalizeAnswerPair,
  normalizeAnswerPhrase,
  splitNormalizedPhrase,
} from "./normalize-answer";

const VALID_RELATIONSHIPS: readonly RelationshipType[] = ["SYNONYM", "ANTONYM"];
const VALID_DIFFICULTIES: readonly Difficulty[] = ["EASY", "MEDIUM", "HARD"];

/**
 * Validates a single puzzle record for structural and semantic integrity.
 * Returns an array of validation errors, which is empty if the puzzle is valid.
 */
export function validatePuzzle(rawPuzzle: unknown): PuzzleValidationError[] {
  const errors: PuzzleValidationError[] = [];

  if (!rawPuzzle || typeof rawPuzzle !== "object") {
    errors.push({
      puzzleId: "UNKNOWN",
      field: "puzzle",
      message: "Puzzle definition must be a valid non-null object.",
    });
    return errors;
  }

  const puzzle = rawPuzzle as Partial<Puzzle>;
  const id = typeof puzzle.id === "string" && puzzle.id.trim() ? puzzle.id.trim() : "UNKNOWN";

  if (!puzzle.id || typeof puzzle.id !== "string" || !puzzle.id.trim()) {
    errors.push({
      puzzleId: id,
      field: "id",
      message: "Puzzle must have a non-empty string ID.",
    });
  }

  // Clue words validation
  if (!Array.isArray(puzzle.clueWords) || puzzle.clueWords.length !== 2) {
    errors.push({
      puzzleId: id,
      field: "clueWords",
      message: "clueWords must be an array of exactly two non-empty words.",
    });
  } else {
    puzzle.clueWords.forEach((word, idx) => {
      if (typeof word !== "string" || !word.trim()) {
        errors.push({
          puzzleId: id,
          field: `clueWords[${idx}]`,
          message: `Clue word at index ${idx} must be a non-empty string.`,
        });
      }
    });
  }

  // Answer words validation
  if (!Array.isArray(puzzle.answerWords) || puzzle.answerWords.length !== 2) {
    errors.push({
      puzzleId: id,
      field: "answerWords",
      message: "answerWords must be an array of exactly two non-empty words.",
    });
  } else {
    puzzle.answerWords.forEach((word, idx) => {
      if (typeof word !== "string" || !word.trim()) {
        errors.push({
          puzzleId: id,
          field: `answerWords[${idx}]`,
          message: `Answer word at index ${idx} must be a non-empty string.`,
        });
      }
    });
  }

  // Transformations validation
  if (!Array.isArray(puzzle.transformations) || puzzle.transformations.length !== 2) {
    errors.push({
      puzzleId: id,
      field: "transformations",
      message: "transformations must be an array of exactly two transformation definitions.",
    });
  } else {
    puzzle.transformations.forEach((t, idx) => {
      if (!t || typeof t !== "object") {
        errors.push({
          puzzleId: id,
          field: `transformations[${idx}]`,
          message: `Transformation at index ${idx} must be a valid object.`,
        });
        return;
      }

      if (typeof t.clueWord !== "string" || !t.clueWord.trim()) {
        errors.push({
          puzzleId: id,
          field: `transformations[${idx}].clueWord`,
          message: `Transformation at index ${idx} must have a non-empty clueWord.`,
        });
      } else if (
        Array.isArray(puzzle.clueWords) &&
        puzzle.clueWords[idx] &&
        t.clueWord.trim().toUpperCase() !== puzzle.clueWords[idx].trim().toUpperCase()
      ) {
        errors.push({
          puzzleId: id,
          field: `transformations[${idx}].clueWord`,
          message: `Transformation clueWord '${t.clueWord}' must match clueWords[${idx}] '${puzzle.clueWords[idx]}'.`,
        });
      }

      if (typeof t.answerWord !== "string" || !t.answerWord.trim()) {
        errors.push({
          puzzleId: id,
          field: `transformations[${idx}].answerWord`,
          message: `Transformation at index ${idx} must have a non-empty answerWord.`,
        });
      } else if (
        Array.isArray(puzzle.answerWords) &&
        puzzle.answerWords[idx] &&
        t.answerWord.trim().toUpperCase() !== puzzle.answerWords[idx].trim().toUpperCase()
      ) {
        errors.push({
          puzzleId: id,
          field: `transformations[${idx}].answerWord`,
          message: `Transformation answerWord '${t.answerWord}' must match answerWords[${idx}] '${puzzle.answerWords[idx]}'.`,
        });
      }

      if (!VALID_RELATIONSHIPS.includes(t.relationship as RelationshipType)) {
        errors.push({
          puzzleId: id,
          field: `transformations[${idx}].relationship`,
          message: `Relationship type must be SYNONYM or ANTONYM, received '${t.relationship}'.`,
        });
      }

      if (typeof t.explanation !== "string" || t.explanation.trim().length < 3) {
        errors.push({
          puzzleId: id,
          field: `transformations[${idx}].explanation`,
          message: `Transformation explanation must be a descriptive string of at least 3 characters.`,
        });
      }
    });
  }

  // Difficulty validation
  if (!VALID_DIFFICULTIES.includes(puzzle.difficulty as Difficulty)) {
    errors.push({
      puzzleId: id,
      field: "difficulty",
      message: `Difficulty must be EASY, MEDIUM, or HARD, received '${puzzle.difficulty}'.`,
    });
  }

  // Approved variants validation
  if (puzzle.approvedVariants !== undefined) {
    if (!Array.isArray(puzzle.approvedVariants)) {
      errors.push({
        puzzleId: id,
        field: "approvedVariants",
        message: "approvedVariants must be an array of strings if provided.",
      });
    } else {
      const canonicalPhrase =
        Array.isArray(puzzle.answerWords) && puzzle.answerWords.length === 2
          ? normalizeAnswerPair(puzzle.answerWords[0] || "", puzzle.answerWords[1] || "")
          : "";

      const seenVariants = new Set<string>();

      puzzle.approvedVariants.forEach((variant, vIdx) => {
        if (typeof variant !== "string" || !variant.trim()) {
          errors.push({
            puzzleId: id,
            field: `approvedVariants[${vIdx}]`,
            message: `Variant at index ${vIdx} must be a non-empty string.`,
          });
          return;
        }

        const normalizedVariant = normalizeAnswerPhrase(variant);
        const split = splitNormalizedPhrase(variant);

        if (!split) {
          errors.push({
            puzzleId: id,
            field: `approvedVariants[${vIdx}]`,
            message: `Variant '${variant}' is not a valid two-word phrase.`,
          });
          return;
        }

        if (seenVariants.has(normalizedVariant)) {
          errors.push({
            puzzleId: id,
            field: `approvedVariants[${vIdx}]`,
            message: `Duplicate approved variant '${variant}' detected.`,
          });
        }
        seenVariants.add(normalizedVariant);

        if (canonicalPhrase && normalizedVariant === canonicalPhrase) {
          errors.push({
            puzzleId: id,
            field: `approvedVariants[${vIdx}]`,
            message: `Variant '${variant}' matches the canonical answer phrase and should not be duplicated in approvedVariants.`,
          });
        }
      });
    }
  }

  return errors;
}

/**
 * Validates an entire collection of puzzles, verifying individual integrity
 * and checking for duplicate puzzle IDs.
 */
export function validatePuzzleCollection(puzzles: readonly unknown[]): PuzzleValidationReport {
  if (!Array.isArray(puzzles)) {
    return {
      isValid: false,
      totalValidated: 0,
      errors: [
        {
          puzzleId: "COLLECTION",
          field: "puzzles",
          message: "Puzzle collection must be an array.",
        },
      ],
    };
  }

  const allErrors: PuzzleValidationError[] = [];
  const seenIds = new Set<string>();

  puzzles.forEach((rawPuzzle, index) => {
    const puzzleErrors = validatePuzzle(rawPuzzle);
    allErrors.push(...puzzleErrors);

    if (rawPuzzle && typeof rawPuzzle === "object" && "id" in rawPuzzle) {
      const id = String((rawPuzzle as { id: unknown }).id);
      if (seenIds.has(id)) {
        allErrors.push({
          puzzleId: id,
          field: `puzzles[${index}].id`,
          message: `Duplicate puzzle ID '${id}' detected in collection.`,
        });
      } else {
        seenIds.add(id);
      }
    }
  });

  return {
    isValid: allErrors.length === 0,
    totalValidated: puzzles.length,
    errors: allErrors,
  };
}
