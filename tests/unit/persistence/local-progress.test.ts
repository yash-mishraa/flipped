import { describe, it, expect, beforeEach } from "vitest";
import {
  loadProgress,
  getDailyAttempt,
  saveDailyAttempt,
  getClassicRecentPuzzleIds,
  getClassicLastDifficulty,
  recordClassicGame,
  clearProgress,
  INITIAL_PROGRESS_DATA,
  STORAGE_KEY_PROGRESS,
} from "@/features/game/persistence/local-progress";
import type { DailyAttemptRecord } from "@/features/game/modes/mode-types";

describe("Local Progress Persistence Adapter", () => {
  beforeEach(() => {
    clearProgress();
  });

  it("loads initial progress schema when uninitialized", () => {
    const progress = loadProgress();
    expect(progress.version).toBe(1);
    expect(progress.daily).toEqual({});
    expect(progress.classic.recentlyPlayedIds).toEqual([]);
    expect(progress.classic.lastDifficulty).toBe("MEDIUM");
    expect(progress.classic.totalPlayed).toBe(0);
    expect(progress.classic.totalWins).toBe(0);
  });

  it("saves and retrieves daily attempts accurately", () => {
    const attempt: DailyAttemptRecord = {
      date: "2026-10-12",
      puzzleId: "bitter-truth",
      status: "WON",
      finalScore: 850,
      elapsedSeconds: 32,
      hintsUsed: 1,
      solvedPhrase: "BITTER TRUTH",
      completedAt: "2026-10-12T09:00:00.000Z",
    };

    saveDailyAttempt(attempt);

    const retrieved = getDailyAttempt("2026-10-12");
    expect(retrieved).toEqual(attempt);

    // Unplayed date returns null
    expect(getDailyAttempt("2026-10-13")).toBeNull();
  });

  it("records Classic game progress and updates recent history", () => {
    expect(getClassicRecentPuzzleIds()).toEqual([]);
    expect(getClassicLastDifficulty()).toBe("MEDIUM");

    recordClassicGame("fast-food", "EASY", true);

    expect(getClassicRecentPuzzleIds()).toEqual(["fast-food"]);
    expect(getClassicLastDifficulty()).toBe("EASY");

    let progress = loadProgress();
    expect(progress.classic.totalPlayed).toBe(1);
    expect(progress.classic.totalWins).toBe(1);

    // Record a second game (loss)
    recordClassicGame("deep-sleep", "HARD", false);

    expect(getClassicRecentPuzzleIds()).toEqual(["deep-sleep", "fast-food"]);
    expect(getClassicLastDifficulty()).toBe("HARD");

    progress = loadProgress();
    expect(progress.classic.totalPlayed).toBe(2);
    expect(progress.classic.totalWins).toBe(1);
  });

  it("clears progress successfully", () => {
    saveDailyAttempt({
      date: "2026-10-12",
      puzzleId: "bitter-truth",
      status: "WON",
      finalScore: 900,
      elapsedSeconds: 20,
      hintsUsed: 0,
      completedAt: "2026-10-12T09:00:00.000Z",
    });

    recordClassicGame("hot-spring", "EASY", true);

    clearProgress();

    expect(getDailyAttempt("2026-10-12")).toBeNull();
    expect(getClassicRecentPuzzleIds()).toEqual([]);
    expect(loadProgress()).toEqual(INITIAL_PROGRESS_DATA);
  });

  it("handles corrupted localStorage JSON gracefully without throwing", () => {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY_PROGRESS, "INVALID_NON_JSON_CONTENT{{{");
      const loaded = loadProgress();
      expect(loaded.version).toBe(1);
      expect(loaded.daily).toEqual({});
    }
  });

  it("isolates logged-in user streak so logout leaves guest mode clean with streak 0, and allows guest to play independently", () => {
    // 1. User logs in with new account
    clearProgress();
    const userId = "user_clerk_test_1";

    // User plays daily challenge and wins
    const userAttempt: DailyAttemptRecord = {
      date: "2026-10-15",
      puzzleId: "cold-shoulder",
      status: "WON",
      finalScore: 100,
      elapsedSeconds: 5,
      hintsUsed: 0,
      solvedPhrase: "COLD SHOULDER",
      completedAt: "2026-10-15T08:00:00.000Z",
    };
    saveDailyAttempt(userAttempt, userId);

    // Verified: User has completed attempt
    const loadedForUser = loadProgress(userId);
    expect(loadedForUser.daily["2026-10-15"]).toEqual(userAttempt);

    // 2. User logs out -> Active user becomes null (Guest Mode)
    const guestProgress = loadProgress(null);
    // Guest mode has NOT played! The daily streak 1 is NOT there!
    expect(guestProgress.daily["2026-10-15"]).toBeUndefined();
    expect(Object.keys(guestProgress.daily).length).toBe(0);

    // 3. User plays again in Guest mode without logging in
    const guestAttempt: DailyAttemptRecord = {
      date: "2026-10-15",
      puzzleId: "cold-shoulder",
      status: "WON",
      finalScore: 95,
      elapsedSeconds: 12,
      hintsUsed: 1,
      solvedPhrase: "COLD SHOULDER",
      completedAt: "2026-10-15T09:00:00.000Z",
    };
    saveDailyAttempt(guestAttempt, null);

    // Guest now has their own attempt
    const updatedGuestProgress = loadProgress(null);
    expect(updatedGuestProgress.daily["2026-10-15"]).toEqual(guestAttempt);
    expect(updatedGuestProgress.daily["2026-10-15"]?.finalScore).toBe(95);

    // 4. User logs back into user account
    const reloadedUser = loadProgress(userId);
    // User's original attempt with score 100 is intact
    expect(reloadedUser.daily["2026-10-15"]).toEqual(userAttempt);
    expect(reloadedUser.daily["2026-10-15"]?.finalScore).toBe(100);
  });
});
