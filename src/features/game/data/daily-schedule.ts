import type { DailyPuzzleAssignment } from "../modes/mode-types";

/**
 * Curated calendar schedule for Flipped Daily challenges.
 * Explicit date strings represent calendar days (YYYY-MM-DD).
 */
export const PUBLISHED_DAILY_SCHEDULE: readonly DailyPuzzleAssignment[] = [
  {
    date: "2026-10-06",
    puzzleId: "fast-food",
    publicationStatus: "PUBLISHED",
    note: "Tuesday Challenge",
  },
  {
    date: "2026-10-07",
    puzzleId: "deep-sleep",
    publicationStatus: "PUBLISHED",
    note: "Wednesday Challenge",
  },
  {
    date: "2026-10-08",
    puzzleId: "hot-spring",
    publicationStatus: "PUBLISHED",
    note: "Thursday Challenge",
  },
  {
    date: "2026-10-09",
    puzzleId: "sweet-dreams",
    publicationStatus: "PUBLISHED",
    note: "Friday Challenge",
  },
  {
    date: "2026-10-10",
    puzzleId: "open-door",
    publicationStatus: "PUBLISHED",
    note: "Saturday Weekend Special",
  },
  {
    date: "2026-10-11",
    puzzleId: "high-tide",
    publicationStatus: "PUBLISHED",
    note: "Sunday Feature",
  },
  {
    date: "2026-10-12",
    puzzleId: "bitter-truth",
    publicationStatus: "PUBLISHED",
    note: "Monday Opener",
  },
  {
    date: "2026-10-13",
    puzzleId: "war-cry",
    publicationStatus: "PUBLISHED",
    note: "Tuesday Challenge",
  },
  {
    date: "2026-10-14",
    puzzleId: "wild-life",
    publicationStatus: "PUBLISHED",
    note: "Wednesday Challenge",
  },
  {
    date: "2026-10-15",
    puzzleId: "cold-shoulder",
    publicationStatus: "PUBLISHED",
    note: "Thursday Challenge",
  },
  {
    date: "2026-10-16",
    puzzleId: "good-night",
    publicationStatus: "PUBLISHED",
    note: "Friday Challenge",
  },
  {
    date: "2026-10-17",
    puzzleId: "freeze-frame",
    publicationStatus: "PUBLISHED",
    note: "Saturday Special",
  },
  {
    date: "2026-10-18",
    puzzleId: "true-love",
    publicationStatus: "PUBLISHED",
    note: "Sunday Feature",
  },
  {
    date: "2026-10-19",
    puzzleId: "ancient-history",
    publicationStatus: "PUBLISHED",
    note: "Monday Opener",
  },
  {
    date: "2026-10-20",
    puzzleId: "light-house",
    publicationStatus: "UNPUBLISHED",
    note: "Upcoming Queue",
  },
  {
    date: "2026-10-21",
    puzzleId: "dry-run",
    publicationStatus: "UNPUBLISHED",
    note: "Upcoming Queue",
  },
];

export const DAILY_SCHEDULE_MAP: ReadonlyMap<string, DailyPuzzleAssignment> = new Map(
  PUBLISHED_DAILY_SCHEDULE.map((item) => [item.date, item])
);
