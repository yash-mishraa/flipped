import type { StoredProgressSchema } from "../persistence/local-progress";
import type { DailyAttemptRecord } from "./mode-types";
import { getDailyDateString, getClientTimezone } from "./daily-scheduler";
import { daysBetweenCalendarDates, previousCalendarDate } from "../domain/calendar-date";

export interface PlayerStatistics {
  readonly totalPlayed: number;
  readonly totalWins: number;
  readonly winRate: number; // 0–100 integer percentage
  readonly totalPoints: number;
  readonly averagePoints: number;
  readonly bestSolveTimeSeconds: number | null;
  readonly averageSolveTimeSeconds: number | null;
  readonly daily: {
    readonly totalPlayed: number;
    readonly totalWins: number;
    readonly winRate: number;
    readonly currentStreak: number;
    readonly longestStreak: number;
    readonly totalPoints: number;
    readonly averagePoints: number;
    readonly bestSolveTimeSeconds: number | null;
    readonly averageSolveTimeSeconds: number | null;
  };
  readonly classic: {
    readonly totalPlayed: number;
    readonly totalWins: number;
    readonly winRate: number;
    readonly totalPoints: number;
    readonly averagePoints: number;
    readonly bestSolveTimeSeconds: number | null;
    readonly averageSolveTimeSeconds: number | null;
    readonly byDifficulty: {
      readonly EASY: { readonly played: number; readonly wins: number };
      readonly MEDIUM: { readonly played: number; readonly wins: number };
      readonly HARD: { readonly played: number; readonly wins: number };
    };
  };
}

/**
 * Calculates day difference between two ISO YYYY-MM-DD date strings.
 * Uses pure calendar arithmetic, so DST and timezone never affect the result.
 */
export function getDaysBetween(dateStrA: string, dateStrB: string): number {
  return daysBetweenCalendarDates(dateStrA, dateStrB);
}

/**
 * Calculates the previous calendar date string (YYYY-MM-DD).
 */
export function getPreviousDateString(dateStr: string): string {
  return previousCalendarDate(dateStr);
}

/**
 * Determines whether a daily attempt was completed outside its official 24-hour window
 * (i.e. as an archive practice puzzle). Archive plays do not count towards official statistics or streaks.
 * Evaluates completion calendar date in the player's local timezone.
 */
export function isArchiveDailyAttempt(
  record: DailyAttemptRecord,
  timezone: string = getClientTimezone()
): boolean {
  if (record.isArchive === true) {
    return true;
  }
  if (record.isArchive === false) {
    return false;
  }
  // If isArchive is not explicitly set, determine by completion timestamp relative to challenge date
  if (record.completedAt) {
    try {
      const completedLocalDate = getDailyDateString(new Date(record.completedAt), timezone);
      if (completedLocalDate > record.date) {
        return true;
      }
    } catch {
      // Ignore parse failure
    }
  }
  return false;
}

/**
 * Calculates the current and longest daily streaks from stored daily attempt records.
 */
export function calculateDailyStreaks(
  dailyAttempts: Record<string, DailyAttemptRecord>,
  todayDateStr: string = getDailyDateString()
): { currentStreak: number; longestStreak: number } {
  // Only evaluate official (non-archive) attempts
  const officialAttempts: Record<string, DailyAttemptRecord> = {};
  for (const [date, attempt] of Object.entries(dailyAttempts)) {
    if (!isArchiveDailyAttempt(attempt)) {
      officialAttempts[date] = attempt;
    }
  }

  // Sort distinct dates chronologically
  const sortedDates = Object.keys(officialAttempts)
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort();

  if (sortedDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // 1. Calculate longest streak across all official history
  let longestStreak = 0;
  let runningStreak = 0;
  let previousWonDate: string | null = null;

  for (const date of sortedDates) {
    const attempt = officialAttempts[date];
    if (attempt?.status === "WON") {
      if (previousWonDate === null) {
        runningStreak = 1;
      } else {
        const diff = getDaysBetween(previousWonDate, date);
        if (diff === 1) {
          runningStreak += 1;
        } else {
          runningStreak = 1;
        }
      }
      previousWonDate = date;
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
    } else {
      // Timeout or incomplete resets streak
      runningStreak = 0;
      previousWonDate = null;
    }
  }

  // 2. Calculate current streak relative to today
  let currentStreak = 0;
  const todayAttempt = officialAttempts[todayDateStr];
  const yesterdayDateStr = getPreviousDateString(todayDateStr);

  let checkDate: string | null = null;

  if (todayAttempt) {
    if (todayAttempt.status === "WON") {
      checkDate = todayDateStr;
    } else {
      // Today was played officially and timed out -> streak is 0
      return { currentStreak: 0, longestStreak };
    }
  } else {
    // Today not yet played -> streak is alive if yesterday was WON officially
    const yesterdayAttempt = officialAttempts[yesterdayDateStr];
    if (yesterdayAttempt?.status === "WON") {
      checkDate = yesterdayDateStr;
    } else {
      return { currentStreak: 0, longestStreak };
    }
  }

  // Walk backwards counting consecutive won days
  while (checkDate && officialAttempts[checkDate]?.status === "WON") {
    currentStreak += 1;
    checkDate = getPreviousDateString(checkDate);
  }

  return { currentStreak, longestStreak };
}

/**
 * Computes authoritative player statistics from stored local progress.
 * Archive daily challenge solves are strictly excluded from daily and total statistics.
 */
export function calculatePlayerStatistics(
  progress: StoredProgressSchema,
  todayDateStr: string = getDailyDateString()
): PlayerStatistics {
  // Only official daily challenges completed within their 24-hour window count towards stats
  const officialDailyRecords = Object.values(progress.daily).filter(
    (r) => !isArchiveDailyAttempt(r)
  );
  const dailyPlayed = officialDailyRecords.length;
  const dailyWins = officialDailyRecords.filter((r) => r.status === "WON");
  const dailyWinCount = dailyWins.length;
  const dailyWinRate = dailyPlayed > 0 ? Math.round((dailyWinCount / dailyPlayed) * 100) : 0;

  const dailyTotalPoints = dailyWins.reduce((sum, r) => sum + (r.finalScore || 0), 0);
  const dailyAveragePoints = dailyWinCount > 0 ? Math.round(dailyTotalPoints / dailyWinCount) : 0;

  const dailySolveTimes = dailyWins
    .map((r) => r.elapsedSeconds)
    .filter((s): s is number => typeof s === "number" && s > 0);

  const dailyBestSolveTime = dailySolveTimes.length > 0 ? Math.min(...dailySolveTimes) : null;
  const dailyAvgSolveTime =
    dailySolveTimes.length > 0
      ? Math.round(dailySolveTimes.reduce((a, b) => a + b, 0) / dailySolveTimes.length)
      : null;

  const { currentStreak, longestStreak } = calculateDailyStreaks(progress.daily, todayDateStr);

  // Classic mode stats
  const classicPlayed = progress.classic.totalPlayed;
  const classicWins = progress.classic.totalWins;
  const classicWinRate = classicPlayed > 0 ? Math.round((classicWins / classicPlayed) * 100) : 0;

  // Classic points: use recorded totalPoints if available; if unrecorded but classicWins > 0, estimate 90 pts per win
  const storedClassicPoints = progress.classic.totalPoints;
  const classicTotalPoints =
    typeof storedClassicPoints === "number" && storedClassicPoints > 0
      ? storedClassicPoints
      : classicWins > 0
        ? classicWins * 90
        : 0;

  const classicAveragePoints = classicWins > 0 ? Math.round(classicTotalPoints / classicWins) : 0;
  const classicBestSolveTime = progress.classic.bestSolveTimeSeconds ?? null;
  const classicAvgSolveTime =
    classicWins > 0 &&
    typeof progress.classic.totalElapsedSeconds === "number" &&
    progress.classic.totalElapsedSeconds > 0
      ? Math.round(progress.classic.totalElapsedSeconds / classicWins)
      : null;

  // Total combined stats
  const totalPlayed = dailyPlayed + classicPlayed;
  const totalWins = dailyWinCount + classicWins;
  const winRate = totalPlayed > 0 ? Math.round((totalWins / totalPlayed) * 100) : 0;
  const totalPoints = dailyTotalPoints + classicTotalPoints;
  const averagePoints = totalWins > 0 ? Math.round(totalPoints / totalWins) : 0;

  // Best & average solve times across all recorded wins
  const allSolveTimes = [...dailySolveTimes];
  if (classicBestSolveTime !== null) {
    allSolveTimes.push(classicBestSolveTime);
  }
  const bestSolveTime = allSolveTimes.length > 0 ? Math.min(...allSolveTimes) : null;
  const avgSolveTime =
    dailyAvgSolveTime !== null && classicAvgSolveTime !== null
      ? Math.round((dailyAvgSolveTime + classicAvgSolveTime) / 2)
      : (dailyAvgSolveTime ?? classicAvgSolveTime);

  return {
    totalPlayed,
    totalWins,
    winRate,
    totalPoints,
    averagePoints,
    bestSolveTimeSeconds: bestSolveTime,
    averageSolveTimeSeconds: avgSolveTime,
    daily: {
      totalPlayed: dailyPlayed,
      totalWins: dailyWinCount,
      winRate: dailyWinRate,
      currentStreak,
      longestStreak,
      totalPoints: dailyTotalPoints,
      averagePoints: dailyAveragePoints,
      bestSolveTimeSeconds: dailyBestSolveTime,
      averageSolveTimeSeconds: dailyAvgSolveTime,
    },
    classic: {
      totalPlayed: classicPlayed,
      totalWins: classicWins,
      winRate: classicWinRate,
      totalPoints: classicTotalPoints,
      averagePoints: classicAveragePoints,
      bestSolveTimeSeconds: classicBestSolveTime,
      averageSolveTimeSeconds: classicAvgSolveTime,
      byDifficulty: {
        EASY: { played: 0, wins: 0 },
        MEDIUM: { played: classicPlayed, wins: classicWins },
        HARD: { played: 0, wins: 0 },
      },
    },
  };
}
