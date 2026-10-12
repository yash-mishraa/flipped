export interface ShareResultOptions {
  readonly mode: "DAILY" | "CLASSIC";
  readonly date?: string;
  readonly isWon: boolean;
  readonly score: number;
  readonly elapsedSeconds: number;
  readonly hintsUsed: number;
  readonly wordLengths?: readonly [number, number];
}

/**
 * Formats a spoiler-free share text string for word puzzle results.
 * Strictly avoids leaking canonical answer words.
 */
export function formatShareText(options: ShareResultOptions): string {
  const { mode, date, isWon, score, elapsedSeconds, hintsUsed, wordLengths } = options;

  const header = mode === "DAILY" && date ? `Flipped Daily • ${date}` : `Flipped Classic Practice`;

  const outcomeLine = isWon
    ? `🎯 Solved in ${elapsedSeconds}s • Score: ${score}/100`
    : `⌛ Time Limit Reached (60s)`;

  const hintLine = `💡 Hints Used: ${hintsUsed}`;

  let emojiGrid = "";
  if (isWon && wordLengths && wordLengths[0] > 0 && wordLengths[1] > 0) {
    const word0 = "🟩".repeat(wordLengths[0]);
    const word1 = "🟩".repeat(wordLengths[1]);
    emojiGrid = `\n${word0} ${word1}`;
  }

  return `${header}\n${outcomeLine}\n${hintLine}${emojiGrid}\n\nPlay at: https://flippedit.vercel.app`;
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
  const title = options.mode === "DAILY" ? "Flipped Daily Challenge" : "Flipped Word Puzzle";

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
