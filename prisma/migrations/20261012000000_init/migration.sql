-- CreateEnum
CREATE TYPE "DifficultyTier" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "PublicationState" AS ENUM ('PUBLISHED', 'UNPUBLISHED');

-- CreateEnum
CREATE TYPE "GameModeType" AS ENUM ('DAILY', 'CLASSIC');

-- CreateEnum
CREATE TYPE "AttemptStatusType" AS ENUM ('ACTIVE', 'WON', 'TIMED_OUT');

-- CreateTable
CREATE TABLE "puzzles" (
    "id" TEXT NOT NULL,
    "clueWord1" TEXT NOT NULL,
    "clueWord2" TEXT NOT NULL,
    "answerWord1" TEXT NOT NULL,
    "answerWord2" TEXT NOT NULL,
    "relationship1" TEXT NOT NULL,
    "relationship2" TEXT NOT NULL,
    "explanation1" TEXT NOT NULL,
    "explanation2" TEXT NOT NULL,
    "difficulty" "DifficultyTier" NOT NULL DEFAULT 'MEDIUM',
    "approvedVariants" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hints" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "publicationStatus" "PublicationState" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "puzzles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_assignments" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "publicationStatus" "PublicationState" NOT NULL DEFAULT 'PUBLISHED',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_attempts" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "mode" "GameModeType" NOT NULL,
    "dailyDate" TEXT,
    "puzzleId" TEXT NOT NULL,
    "status" "AttemptStatusType" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadline" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "elapsedSeconds" INTEGER NOT NULL DEFAULT 0,
    "hintsUsed" INTEGER NOT NULL DEFAULT 0,
    "finalScore" INTEGER NOT NULL DEFAULT 0,
    "isWon" BOOLEAN NOT NULL DEFAULT false,
    "solvedPhrase" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_profiles" (
    "guestId" TEXT NOT NULL,
    "currentDailyStreak" INTEGER NOT NULL DEFAULT 0,
    "longestDailyStreak" INTEGER NOT NULL DEFAULT 0,
    "lastDailyDate" TEXT,
    "classicPlayed" INTEGER NOT NULL DEFAULT 0,
    "classicWins" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guest_profiles_pkey" PRIMARY KEY ("guestId")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_assignments_date_key" ON "daily_assignments"("date");

-- CreateIndex
CREATE INDEX "daily_assignments_date_idx" ON "daily_assignments"("date");

-- CreateIndex
CREATE INDEX "game_attempts_guestId_idx" ON "game_attempts"("guestId");

-- CreateIndex
CREATE INDEX "game_attempts_puzzleId_idx" ON "game_attempts"("puzzleId");

-- CreateIndex
CREATE INDEX "game_attempts_mode_idx" ON "game_attempts"("mode");

-- CreateIndex
CREATE UNIQUE INDEX "unique_guest_daily_attempt" ON "game_attempts"("guestId", "dailyDate");

-- AddForeignKey
ALTER TABLE "daily_assignments" ADD CONSTRAINT "daily_assignments_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "puzzles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_attempts" ADD CONSTRAINT "game_attempts_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "puzzles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
