import { PrismaClient } from "@prisma/client";
import { CURATED_PUZZLES } from "@/features/game/data/puzzles";
import { PUBLISHED_DAILY_SCHEDULE } from "@/features/game/data/daily-schedule";
import type { Difficulty, Puzzle } from "@/features/game/domain/types";

// Global singleton instance for Next.js App Router development hot-reloading
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  return Boolean(
    url && url.startsWith("postgresql://") && !url.includes("localhost:5432/flipped_db")
  );
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// ---------------------------------------------------------------------------
// In-Memory Storage Adapter
// Serves development/testing environments when a live PostgreSQL instance
// is not provisioned, ensuring 100% testability and zero crashes.
// ---------------------------------------------------------------------------

export interface StoredAttempt {
  id: string;
  guestId: string;
  mode: "DAILY" | "CLASSIC";
  dailyDate: string | null;
  puzzleId: string;
  status: "ACTIVE" | "WON" | "TIMED_OUT";
  startedAt: Date;
  deadline: Date;
  endedAt: Date | null;
  elapsedSeconds: number;
  hintsUsed: number;
  finalScore: number;
  isWon: boolean;
  solvedPhrase: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredGuestProfile {
  guestId: string;
  currentDailyStreak: number;
  longestDailyStreak: number;
  lastDailyDate: string | null;
  classicPlayed: number;
  classicWins: number;
  createdAt: Date;
  updatedAt: Date;
}

import type { StoredProgressSchema } from "@/features/game/persistence/local-progress";

class InMemoryDatabase {
  private puzzles: Map<string, Puzzle> = new Map();
  private dailyAssignments: Map<
    string,
    { date: string; puzzleId: string; publicationStatus: string; note?: string }
  > = new Map();
  private attempts: Map<string, StoredAttempt> = new Map();
  private guestProfiles: Map<string, StoredGuestProfile> = new Map();
  private userProgress: Map<string, StoredProgressSchema> = new Map();

  constructor() {
    this.seedDefaultData();
  }

  public seedDefaultData(): void {
    this.puzzles.clear();
    this.dailyAssignments.clear();

    for (const p of CURATED_PUZZLES) {
      this.puzzles.set(p.id, p);
    }
    for (const item of PUBLISHED_DAILY_SCHEDULE) {
      this.dailyAssignments.set(item.date, {
        date: item.date,
        puzzleId: item.puzzleId,
        publicationStatus: item.publicationStatus,
        note: item.note,
      });
    }
  }

  public clearAttempts(): void {
    this.attempts.clear();
    this.guestProfiles.clear();
    this.userProgress.clear();
  }

  public getUserProgress(userId: string): StoredProgressSchema | null {
    return this.userProgress.get(userId) ?? null;
  }

  public saveUserProgress(userId: string, progress: StoredProgressSchema): StoredProgressSchema {
    this.userProgress.set(userId, progress);
    return progress;
  }

  public getPuzzle(id: string): Puzzle | null {
    return this.puzzles.get(id) ?? null;
  }

  public getPuzzlesByDifficulty(difficulty: Difficulty): Puzzle[] {
    return Array.from(this.puzzles.values()).filter((p) => p.difficulty === difficulty);
  }

  public getDailyAssignment(date: string) {
    return this.dailyAssignments.get(date) ?? null;
  }

  public getAllPublishedDailyAssignments() {
    return Array.from(this.dailyAssignments.values()).filter(
      (a) => a.publicationStatus === "PUBLISHED"
    );
  }

  public getAttempt(id: string): StoredAttempt | null {
    return this.attempts.get(id) ?? null;
  }

  public findDailyAttempt(guestId: string, dailyDate: string): StoredAttempt | null {
    for (const attempt of this.attempts.values()) {
      if (attempt.guestId === guestId && attempt.dailyDate === dailyDate) {
        return attempt;
      }
    }
    return null;
  }

  public saveAttempt(attempt: StoredAttempt): StoredAttempt {
    this.attempts.set(attempt.id, { ...attempt, updatedAt: new Date() });
    return this.attempts.get(attempt.id)!;
  }

  public getGuestProfile(guestId: string): StoredGuestProfile {
    let profile = this.guestProfiles.get(guestId);
    if (!profile) {
      profile = {
        guestId,
        currentDailyStreak: 0,
        longestDailyStreak: 0,
        lastDailyDate: null,
        classicPlayed: 0,
        classicWins: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.guestProfiles.set(guestId, profile);
    }
    return profile;
  }

  public saveGuestProfile(profile: StoredGuestProfile): StoredGuestProfile {
    this.guestProfiles.set(profile.guestId, { ...profile, updatedAt: new Date() });
    return this.guestProfiles.get(profile.guestId)!;
  }
}

const globalForDb = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  inMemoryDb: InMemoryDatabase | undefined;
};

export const inMemoryDb = globalForDb.inMemoryDb ?? new InMemoryDatabase();

if (process.env.NODE_ENV !== "production") {
  globalForDb.inMemoryDb = inMemoryDb;
}
