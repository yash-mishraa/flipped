import type { Difficulty } from "../domain/types";
import type { DailyAttemptRecord } from "../modes/mode-types";

export const STORAGE_KEY_PROGRESS = "flipped_progress_v1";

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
  },
};

// In-memory fallback for SSR and environments where localStorage is blocked
let inMemoryStore: StoredProgressSchema = { ...INITIAL_PROGRESS_DATA };

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
 * Loads the current local progress snapshot safely.
 * Returns default initial state if uninitialized, corrupted, or unavailable.
 */
export function loadProgress(): StoredProgressSchema {
  if (!isLocalStorageAvailable()) {
    return inMemoryStore;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_PROGRESS);
    if (!raw) {
      return INITIAL_PROGRESS_DATA;
    }

    const parsed = JSON.parse(raw) as Partial<StoredProgressSchema>;
    if (!parsed || parsed.version !== 1 || typeof parsed.daily !== "object") {
      return INITIAL_PROGRESS_DATA;
    }

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
        totalWins: typeof parsed.classic?.totalWins === "number" ? parsed.classic.totalWins : 0,
      },
    };
  } catch {
    return INITIAL_PROGRESS_DATA;
  }
}

/**
 * Persists the entire progress snapshot safely.
 */
export function saveProgress(data: StoredProgressSchema): void {
  inMemoryStore = data;

  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(data));
  } catch {
    // Ignore storage quota or security exceptions gracefully
  }
}

/**
 * Retrieves the daily attempt record for a given date (YYYY-MM-DD).
 */
export function getDailyAttempt(date: string): DailyAttemptRecord | null {
  const progress = loadProgress();
  return progress.daily[date] ?? null;
}

/**
 * Saves or updates a daily challenge attempt record.
 */
export function saveDailyAttempt(record: DailyAttemptRecord): void {
  const current = loadProgress();
  const updated: StoredProgressSchema = {
    ...current,
    daily: {
      ...current.daily,
      [record.date]: record,
    },
  };
  saveProgress(updated);
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
 * Records a completed Classic game, maintaining recent puzzle history and counters.
 */
export function recordClassicGame(
  puzzleId: string,
  difficulty: Difficulty,
  won: boolean,
  maxRecentKeep: number = 20
): void {
  const current = loadProgress();
  const filteredRecents = current.classic.recentlyPlayedIds.filter((id) => id !== puzzleId);
  const updatedRecents = [puzzleId, ...filteredRecents].slice(0, maxRecentKeep);

  const updated: StoredProgressSchema = {
    ...current,
    classic: {
      recentlyPlayedIds: updatedRecents,
      lastDifficulty: difficulty,
      totalPlayed: current.classic.totalPlayed + 1,
      totalWins: current.classic.totalWins + (won ? 1 : 0),
    },
  };
  saveProgress(updated);
}

/**
 * Resets all local progress (useful for testing or explicit user reset).
 */
export function clearProgress(): void {
  inMemoryStore = { ...INITIAL_PROGRESS_DATA };
  if (isLocalStorageAvailable()) {
    try {
      window.localStorage.removeItem(STORAGE_KEY_PROGRESS);
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
