import type { Difficulty } from "../domain/types";
import type { DailyAttemptRecord } from "../modes/mode-types";

export const STORAGE_KEY_PROGRESS = "flipped_progress_v1";
export const STORAGE_KEY_GUEST_PROGRESS = "flipped_progress_guest_v1";
export const STORAGE_KEY_USER_PREFIX = "flipped_progress_user_";
export const STORAGE_KEY_ACTIVE_USER = "flipped_active_user_v1";

export interface StoredProgressSchema {
  readonly version: 1;
  readonly daily: {
    readonly [date: string]: DailyAttemptRecord;
  };
  readonly classic: {
    readonly recentlyPlayedIds: readonly string[];
    readonly lastDifficulty: Difficulty;
    readonly totalPlayed: number;
    readonly totalWins: number;
    readonly totalPoints?: number;
    readonly bestSolveTimeSeconds?: number | null;
    readonly totalElapsedSeconds?: number;
  };
}

export const INITIAL_PROGRESS_DATA: StoredProgressSchema = {
  version: 1,
  daily: {},
  classic: {
    recentlyPlayedIds: [],
    lastDifficulty: "MEDIUM",
    totalPlayed: 0,
    totalWins: 0,
    totalPoints: 0,
    bestSolveTimeSeconds: null,
    totalElapsedSeconds: 0,
  },
};

// In-memory fallback for SSR and environments where localStorage is blocked
let inMemoryStore: StoredProgressSchema = { ...INITIAL_PROGRESS_DATA };
let currentActiveUserId: string | null | undefined = undefined;

/**
 * Sets the active user context (Clerk userId or null for guest mode).
 */
export function setActiveUser(userId: string | null): void {
  currentActiveUserId = userId;
  if (isLocalStorageAvailable()) {
    try {
      if (userId) {
        window.localStorage.setItem(STORAGE_KEY_ACTIVE_USER, userId);
      } else {
        window.localStorage.removeItem(STORAGE_KEY_ACTIVE_USER);
      }
    } catch {
      // Ignore
    }
  }
}

/**
 * Gets the active user context (Clerk userId or null for guest mode).
 */
export function getActiveUser(): string | null {
  if (currentActiveUserId !== undefined) {
    return currentActiveUserId;
  }
  if (isLocalStorageAvailable()) {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY_ACTIVE_USER);
      currentActiveUserId = stored || null;
      return currentActiveUserId;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Resolves the localStorage key for the given or active user.
 */
export function getStorageKey(userId?: string | null): string {
  const targetId = userId !== undefined ? userId : getActiveUser();
  if (targetId) {
    return `${STORAGE_KEY_USER_PREFIX}${targetId}`;
  }
  return STORAGE_KEY_GUEST_PROGRESS;
}

function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return false;
    }
    const testKey = "__flipped_storage_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Loads the current local progress snapshot safely for the active user or guest.
 * Returns default initial state if uninitialized, corrupted, or unavailable.
 */
export function loadProgress(userId?: string | null): StoredProgressSchema {
  if (!isLocalStorageAvailable()) {
    return inMemoryStore;
  }

  const key = getStorageKey(userId);

  try {
    let raw = window.localStorage.getItem(key);
    // If guest storage is requested and empty, check legacy storage key
    if (!raw && key === STORAGE_KEY_GUEST_PROGRESS) {
      const legacy = window.localStorage.getItem(STORAGE_KEY_PROGRESS);
      if (legacy) {
        raw = legacy;
      }
    }

    if (!raw) {
      return INITIAL_PROGRESS_DATA;
    }

    const parsed = JSON.parse(raw) as Partial<StoredProgressSchema>;
    if (!parsed || parsed.version !== 1 || typeof parsed.daily !== "object") {
      return INITIAL_PROGRESS_DATA;
    }

    const wins = typeof parsed.classic?.totalWins === "number" ? parsed.classic.totalWins : 0;
    const storedPoints =
      typeof parsed.classic?.totalPoints === "number" ? parsed.classic.totalPoints : 0;
    // Fallback: If player already has classic wins recorded but points were 0/missing, estimate ~90 pts per win
    const totalPoints = storedPoints > 0 ? storedPoints : wins > 0 ? wins * 90 : 0;

    return {
      version: 1,
      daily: parsed.daily ?? {},
      classic: {
        recentlyPlayedIds: Array.isArray(parsed.classic?.recentlyPlayedIds)
          ? parsed.classic.recentlyPlayedIds
          : [],
        lastDifficulty: parsed.classic?.lastDifficulty ?? "MEDIUM",
        totalPlayed:
          typeof parsed.classic?.totalPlayed === "number" ? parsed.classic.totalPlayed : 0,
        totalWins: wins,
        totalPoints,
        bestSolveTimeSeconds:
          typeof parsed.classic?.bestSolveTimeSeconds === "number"
            ? parsed.classic.bestSolveTimeSeconds
            : null,
        totalElapsedSeconds:
          typeof parsed.classic?.totalElapsedSeconds === "number"
            ? parsed.classic.totalElapsedSeconds
            : 0,
      },
    };
  } catch {
    return INITIAL_PROGRESS_DATA;
  }
}

/**
 * Persists the entire progress snapshot safely for the active user or guest.
 */
export function saveProgress(data: StoredProgressSchema, userId?: string | null): void {
  inMemoryStore = data;

  if (!isLocalStorageAvailable()) {
    return;
  }

  const key = getStorageKey(userId);

  try {
    window.localStorage.setItem(key, JSON.stringify(data));
    if (key === STORAGE_KEY_GUEST_PROGRESS) {
      window.localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(data));
    }
  } catch {
    // Ignore storage quota or security exceptions gracefully
  }
}

/**
 * Retrieves the daily attempt record for a given date (YYYY-MM-DD).
 */
export function getDailyAttempt(date: string, userId?: string | null): DailyAttemptRecord | null {
  const progress = loadProgress(userId);
  return progress.daily[date] ?? null;
}

/**
 * Saves or updates a daily challenge attempt record for the active user or guest.
 */
export function saveDailyAttempt(record: DailyAttemptRecord, userId?: string | null): void {
  const current = loadProgress(userId);
  const updated: StoredProgressSchema = {
    ...current,
    daily: {
      ...current.daily,
      [record.date]: record,
    },
  };
  saveProgress(updated, userId);
}

/**
 * Retrieves recently played Classic puzzle IDs.
 */
export function getClassicRecentPuzzleIds(): readonly string[] {
  const progress = loadProgress();
  return progress.classic.recentlyPlayedIds;
}

/**
 * Retrieves the last selected Classic difficulty.
 */
export function getClassicLastDifficulty(): Difficulty {
  const progress = loadProgress();
  return progress.classic.lastDifficulty;
}

/**
 * Records a completed Classic game, maintaining recent puzzle history, cumulative points, and speed records.
 */
export function recordClassicGame(
  puzzleId: string,
  difficulty: Difficulty,
  won: boolean,
  points: number = 0,
  elapsedSeconds?: number,
  maxRecentKeep: number = 100,
  userId?: string | null
): void {
  const current = loadProgress(userId);
  const filteredRecents = current.classic.recentlyPlayedIds.filter((id) => id !== puzzleId);
  const updatedRecents = [puzzleId, ...filteredRecents].slice(0, maxRecentKeep);

  const prevBestTime = current.classic.bestSolveTimeSeconds ?? null;
  const newBestTime =
    won && typeof elapsedSeconds === "number" && elapsedSeconds > 0
      ? prevBestTime !== null
        ? Math.min(prevBestTime, elapsedSeconds)
        : elapsedSeconds
      : prevBestTime;

  const currentPoints =
    typeof current.classic.totalPoints === "number" && current.classic.totalPoints > 0
      ? current.classic.totalPoints
      : current.classic.totalWins > 0
        ? current.classic.totalWins * 90
        : 0;

  const earnedPoints = won ? (points > 0 ? points : 90) : 0;

  const updated: StoredProgressSchema = {
    ...current,
    classic: {
      recentlyPlayedIds: updatedRecents,
      lastDifficulty: difficulty,
      totalPlayed: current.classic.totalPlayed + 1,
      totalWins: current.classic.totalWins + (won ? 1 : 0),
      totalPoints: currentPoints + earnedPoints,
      bestSolveTimeSeconds: newBestTime,
      totalElapsedSeconds:
        (current.classic.totalElapsedSeconds ?? 0) +
        (typeof elapsedSeconds === "number" ? elapsedSeconds : 0),
    },
  };
  saveProgress(updated, userId);
}

/**
 * Explicitly clears the guest progress so logged-out sessions start fresh.
 */
export function clearGuestProgress(): void {
  if (isLocalStorageAvailable()) {
    try {
      window.localStorage.removeItem(STORAGE_KEY_GUEST_PROGRESS);
      window.localStorage.removeItem(STORAGE_KEY_PROGRESS);
    } catch {
      // Ignore
    }
  }
}

/**
 * Resets local progress (useful for testing or explicit user reset).
 */
export function clearProgress(userId?: string | null): void {
  inMemoryStore = { ...INITIAL_PROGRESS_DATA };
  if (isLocalStorageAvailable()) {
    try {
      if (userId === undefined) {
        const key = getStorageKey();
        window.localStorage.removeItem(key);
        window.localStorage.removeItem(STORAGE_KEY_GUEST_PROGRESS);
        window.localStorage.removeItem(STORAGE_KEY_PROGRESS);
        window.localStorage.removeItem(STORAGE_KEY_ACTIVE_USER);
        currentActiveUserId = null;
      } else {
        const key = getStorageKey(userId);
        window.localStorage.removeItem(key);
        if (key === STORAGE_KEY_GUEST_PROGRESS) {
          window.localStorage.removeItem(STORAGE_KEY_PROGRESS);
        }
      }
    } catch {
      // Ignore
    }
  }
}

export const STORAGE_KEY_ONBOARDING = "flipped_onboarding_completed_v1";
let inMemoryOnboardingCompleted = false;

/**
 * Checks whether the player has completed or skipped the onboarding tutorial.
 */
export function isOnboardingCompleted(): boolean {
  if (!isLocalStorageAvailable()) {
    return inMemoryOnboardingCompleted;
  }
  try {
    return window.localStorage.getItem(STORAGE_KEY_ONBOARDING) === "true";
  } catch {
    return inMemoryOnboardingCompleted;
  }
}

/**
 * Sets the onboarding completed flag.
 */
export function setOnboardingCompleted(completed: boolean = true): void {
  inMemoryOnboardingCompleted = completed;
  if (!isLocalStorageAvailable()) {
    return;
  }
  try {
    if (completed) {
      window.localStorage.setItem(STORAGE_KEY_ONBOARDING, "true");
    } else {
      window.localStorage.removeItem(STORAGE_KEY_ONBOARDING);
    }
  } catch {
    // Ignore storage quota or security exceptions
  }
}
