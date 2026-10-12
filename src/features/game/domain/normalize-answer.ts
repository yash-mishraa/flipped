/**
 * Answer normalization utilities.
 * Ensures deterministic parsing, casing, whitespace trimming, and punctuation handling.
 */

/**
 * Normalizes an individual word: trims, converts to uppercase,
 * and strips non-alphabetic characters.
 */
export function normalizeWord(word: string): string {
  if (typeof word !== "string") {
    return "";
  }
  return word
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
}

/**
 * Normalizes a full answer phrase:
 * - Trims leading and trailing whitespace.
 * - Converts hyphens or underscores between words into single spaces.
 * - Collapses consecutive whitespace characters into a single space.
 * - Strips any punctuation or symbols other than spaces and English letters.
 * - Uppercases all characters.
 */
export function normalizeAnswerPhrase(phrase: string): string {
  if (typeof phrase !== "string") {
    return "";
  }

  return phrase
    .trim()
    .toUpperCase()
    .replace(/[-_]+/g, " ")
    .replace(/[^A-Z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Combines and normalizes two distinct answer words into a canonical two-word phrase.
 * Returns an empty string if either word fails to produce valid letters.
 */
export function normalizeAnswerPair(firstWord: string, secondWord: string): string {
  const normFirst = normalizeWord(firstWord);
  const normSecond = normalizeWord(secondWord);

  if (!normFirst || !normSecond) {
    return "";
  }

  return `${normFirst} ${normSecond}`;
}

/**
 * Parses and splits a phrase into exactly two normalized words.
 * Returns null if the phrase cannot be split into exactly two non-empty words.
 */
export function splitNormalizedPhrase(phrase: string): readonly [string, string] | null {
  const normalized = normalizeAnswerPhrase(phrase);
  if (!normalized) {
    return null;
  }

  const parts = normalized.split(" ");
  if (parts.length !== 2) {
    return null;
  }

  const first = parts[0];
  const second = parts[1];

  if (!first || !second) {
    return null;
  }

  return [first, second];
}

/**
 * Compares two answer representations for canonical semantic equivalence.
 */
export function areAnswersEquivalent(phraseA: string, phraseB: string): boolean {
  const normA = normalizeAnswerPhrase(phraseA);
  const normB = normalizeAnswerPhrase(phraseB);

  if (!normA || !normB) {
    return false;
  }

  return normA === normB;
}
