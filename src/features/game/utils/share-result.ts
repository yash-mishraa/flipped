export interface ShareResultOptions {
  readonly mode: "DAILY" | "CLASSIC";
  readonly date?: string;
  readonly isWon: boolean;
  readonly score: number;
  readonly elapsedSeconds: number;
  readonly hintsUsed: number;
  readonly wordLengths?: readonly [number, number];
  readonly sprintPuzzlesSolved?: number;
  readonly streak?: number;
  readonly baseUrl?: string;
}

/**
 * Formats a spoiler-free share text string for word puzzle results.
 * Strictly avoids leaking canonical answer words.
 */
export function formatShareText(options: ShareResultOptions): string {
  const {
    mode,
    date,
    isWon,
    score,
    elapsedSeconds,
    hintsUsed,
    wordLengths,
    sprintPuzzlesSolved,
    streak,
    baseUrl: customBaseUrl,
  } = options;

  const origin =
    customBaseUrl ||
    (typeof window !== "undefined" &&
    window.location?.origin &&
    !window.location.origin.includes("localhost")
      ? window.location.origin
      : "https://www.flipped.website");

  const targetUrl = mode === "DAILY" ? `${origin}/daily` : `${origin}/classic`;

  // 1. Classic Timed Sprint Mode (multiple puzzles solved against sprint timer)
  if (sprintPuzzlesSolved !== undefined) {
    const header = `Flipped Classic Sprint (${elapsedSeconds}s)`;
    const solvedCount = sprintPuzzlesSolved;
    const outcomeLine =
      solvedCount > 0
        ? `⚡ Solved: ${solvedCount} ${solvedCount === 1 ? "Puzzle" : "Puzzles"} • Score: ${score} pts`
        : `⌛ Sprint Finished • 0 Puzzles Solved`;
    const hintLine = `💡 Hints Used: ${hintsUsed}`;
    const emojiGrid = solvedCount > 0 ? `\n${"🟩 ".repeat(solvedCount).trim()}` : "";

    return `${header}\n${outcomeLine}\n${hintLine}${emojiGrid}\n\nPlay at: ${targetUrl}`;
  }

  // 2. Single Puzzle Mode (Daily Challenge or Classic Single Practice)
  const isDaily = mode === "DAILY";
  const header = isDaily && date ? `Flipped Daily • ${date}` : `Flipped Classic Practice`;

  const scoreDisplay = score <= 100 ? `${score}/100` : `${score} pts`;
  const outcomeLine = isWon
    ? `🎯 Solved in ${elapsedSeconds}s • Score: ${scoreDisplay}`
    : `⌛ Time Limit Reached (${elapsedSeconds}s)`;

  const hintLine =
    streak !== undefined && streak > 0
      ? `💡 Hints Used: ${hintsUsed} • Streak: ${streak}`
      : `💡 Hints Used: ${hintsUsed}`;

  let emojiGrid = "";
  if (isWon && wordLengths && wordLengths[0] > 0 && wordLengths[1] > 0) {
    const word0 = "🟩".repeat(wordLengths[0]);
    const word1 = "🟩".repeat(wordLengths[1]);
    emojiGrid = `\n${word0} ${word1}`;
  }

  return `${header}\n${outcomeLine}\n${hintLine}${emojiGrid}\n\nPlay at: ${targetUrl}`;
}

export interface ShareOutcome {
  readonly success: boolean;
  readonly method: "share" | "clipboard" | "none";
  readonly error?: string;
}

/**
 * Dispatches native Web Share API if supported, or copies to clipboard with fallback.
 */
export async function shareResult(options: ShareResultOptions): Promise<ShareOutcome> {
  const text = formatShareText(options);
  const title =
    options.sprintPuzzlesSolved !== undefined
      ? "Flipped Classic Sprint"
      : options.mode === "DAILY"
        ? "Flipped Daily Challenge"
        : "Flipped Word Puzzle";

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({
        title,
        text,
      });
      return { success: true, method: "share" };
    } catch (err: unknown) {
      // AbortError is triggered when user cancels native sheet; don't report as hard error
      if (err instanceof Error && err.name === "AbortError") {
        return { success: false, method: "none" };
      }
      // If native share fails for another reason, fallback to clipboard
    }
  }

  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return { success: true, method: "clipboard" };
    } catch {
      return {
        success: false,
        method: "none",
        error: "Clipboard permission denied.",
      };
    }
  }

  return {
    success: false,
    method: "none",
    error: "Sharing not supported in this browser environment.",
  };
}
