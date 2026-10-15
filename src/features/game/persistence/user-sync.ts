import {
  loadProgress,
  saveProgress,
  clearGuestProgress,
  setActiveUser,
  type StoredProgressSchema,
} from "./local-progress";
import {
  calculatePlayerStatistics,
  type PlayerStatistics,
} from "../modes/statistics";
import { getDailyDateString } from "../modes/daily-scheduler";

export interface SyncResult {
  progress: StoredProgressSchema;
  stats: PlayerStatistics;
  syncedWithCloud: boolean;
}

/**
 * Synchronizes local player progress with the authoritative account record on the server.
 * Merges games, solve times, and streaks under the user's Clerk identity.
 */
export async function syncUserProgress(userId: string): Promise<SyncResult> {
  const todayStr = getDailyDateString();

  if (!userId) {
    const guestProgress = loadProgress(null);
    const fallbackStats = calculatePlayerStatistics(guestProgress, todayStr);
    return {
      progress: guestProgress,
      stats: fallbackStats,
      syncedWithCloud: false,
    };
  }

  // Ensure active user is set
  setActiveUser(userId);

  // Check if this user already has user-specific local progress
  const userProgress = loadProgress(userId);
  const userDailyCount = Object.keys(userProgress.daily).length;
  const userClassicCount = userProgress.classic.totalPlayed;
  const hasUserData = userDailyCount > 0 || userClassicCount > 0;

  // Check guest progress: if user has no plays yet but guest played before login, migrate guest plays
  const guestProgress = loadProgress(null);
  const guestDailyCount = Object.keys(guestProgress.daily).length;
  const guestClassicCount = guestProgress.classic.totalPlayed;
  const hasGuestData = guestDailyCount > 0 || guestClassicCount > 0;

  let activeUserProgress = userProgress;
  if (!hasUserData && hasGuestData) {
    saveProgress(guestProgress, userId);
    clearGuestProgress();
    activeUserProgress = guestProgress;
  }

  const progressToUpload: StoredProgressSchema = activeUserProgress;

  try {
    const res = await fetch("/api/user/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, progress: progressToUpload }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.progress && data.stats) {
        // Save merged progress under user storage
        saveProgress(data.progress, userId);

        return {
          progress: data.progress,
          stats: data.stats,
          syncedWithCloud: true,
        };
      }
    }
  } catch {
    // Network or server unavailable - fallback gracefully to local calculation
  }

  const localStats = calculatePlayerStatistics(activeUserProgress, todayStr);
  return {
    progress: activeUserProgress,
    stats: localStats,
    syncedWithCloud: false,
  };
}
