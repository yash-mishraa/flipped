/**
 * Timer utility calculations and formatters for Flipped.
 * Completely framework-independent.
 */

export const DEFAULT_ROUND_DURATION_SECONDS = 60;

export type TimerUrgency = "normal" | "urgent" | "critical" | "expired";

/**
 * Formats a duration in seconds into MM:SS notation.
 * e.g., 60 -> "01:00", 59 -> "00:59", 0 -> "00:00"
 */
export function formatTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSecs = safeSeconds % 60;

  const mm = String(minutes).padStart(2, "0");
  const ss = String(remainingSecs).padStart(2, "0");
  return `${mm}:${ss}`;
}

/**
 * Categorizes remaining time into visual urgency tiers.
 * - Normal: > 20 seconds
 * - Urgent: 11 - 20 seconds
 * - Critical: 1 - 10 seconds
 * - Expired: 0 seconds
 */
export function getTimerUrgency(remainingSeconds: number): TimerUrgency {
  if (remainingSeconds <= 0) {
    return "expired";
  }
  if (remainingSeconds <= 10) {
    return "critical";
  }
  if (remainingSeconds <= 20) {
    return "urgent";
  }
  return "normal";
}

/**
 * Calculates remaining whole seconds until a given deadline timestamp.
 */
export function calculateRemainingSeconds(deadlineMs: number, nowMs: number): number {
  const remainingMs = Math.max(0, deadlineMs - nowMs);
  return Math.ceil(remainingMs / 1000);
}

/**
 * Calculates elapsed whole seconds from a start timestamp, bounded by maxSeconds.
 */
export function calculateElapsedSeconds(
  startedAtMs: number,
  nowMs: number,
  maxSeconds: number = DEFAULT_ROUND_DURATION_SECONDS
): number {
  if (nowMs < startedAtMs) {
    return 0;
  }
  const elapsed = Math.floor((nowMs - startedAtMs) / 1000);
  return Math.min(maxSeconds, Math.max(0, elapsed));
}
