import {
  loadProgress,
  saveProgress,
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
  const localProgress = loadProgress();
  const todayStr = getDailyDateString();

  if (!userId) {
    const fallbackStats = calculatePlayerStatistics(localProgress, todayStr);
    return {
      progress: localProgress,
      stats: fallbackStats,
      syncedWithCloud: false,
    };
  }

  try {
    const res = await fetch("/api/user/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, progress: localProgress }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.progress && data.stats) {
        // Update active local storage with the merged cloud progress
        saveProgress(data.progress);
        try {
          if (typeof window !== "undefined" && window.localStorage) {
            window.localStorage.setItem(
              `flipped_progress_user_${userId}`,
              JSON.stringify(data.progress)
            );
          }
        } catch {
          // Ignore storage quota errors
        }

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

  const localStats = calculatePlayerStatistics(localProgress, todayStr);
  return {
    progress: localProgress,
    stats: localStats,
    syncedWithCloud: false,
  };
}
