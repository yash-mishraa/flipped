"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ServerGameBoard } from "@/features/game/components/ServerGameBoard";
import { DailyCompletionCard } from "@/features/game/components/DailyCompletionCard";
import {
  saveDailyAttempt,
  loadProgress,
  setActiveUser,
} from "@/features/game/persistence/local-progress";
import { syncUserProgress } from "@/features/game/persistence/user-sync";
import { getDailyDateString, getDailyPuzzle } from "@/features/game/modes/daily-scheduler";
import type {
  SafeGameplayPayload,
  FinalizedResultPayload,
} from "@/server/puzzles/puzzle-repository";
import type { Puzzle } from "@/features/game/domain/types";
import type { DailyAttemptRecord } from "@/features/game/modes/mode-types";

function convertFinalizedToCardProps(finalized: FinalizedResultPayload): {
  puzzle: Puzzle;
  attempt: DailyAttemptRecord;
} {
  const puzzle: Puzzle = {
    id: finalized.puzzleId,
    clueWords: [
      finalized.transformations[0]?.clueWord || "",
      finalized.transformations[1]?.clueWord || "",
    ],
    answerWords: (finalized.canonicalPhrase.split(" ") as [string, string]) || ["", ""],
    transformations: [
      {
        clueWord: finalized.transformations[0]?.clueWord || "",
        answerWord: finalized.transformations[0]?.answerWord || "",
        relationship: finalized.transformations[0]?.relationship || "SYNONYM",
        explanation: finalized.transformations[0]?.explanation || "",
      },
      {
        clueWord: finalized.transformations[1]?.clueWord || "",
        answerWord: finalized.transformations[1]?.answerWord || "",
        relationship: finalized.transformations[1]?.relationship || "SYNONYM",
        explanation: finalized.transformations[1]?.explanation || "",
      },
    ],
    difficulty: "MEDIUM",
  };

  const attempt: DailyAttemptRecord = {
    date: finalized.date || new Date().toISOString().slice(0, 10),
    puzzleId: finalized.puzzleId,
    status: finalized.status,
    finalScore: finalized.finalScore,
    elapsedSeconds: finalized.elapsedSeconds,
    hintsUsed: finalized.hintsUsed,
    solvedPhrase: finalized.solvedPhrase || finalized.canonicalPhrase,
    completedAt: finalized.completedAt,
    isArchive: finalized.isArchive,
  };

  return { puzzle, attempt };
}

function DailyPageContent(): React.JSX.Element {
  const { isSignedIn, user } = useUser();
  const searchParams = useSearchParams();
  const queryDate = searchParams?.get("date") || undefined;

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [payload, setPayload] = useState<SafeGameplayPayload | null>(null);
  const [completedResult, setCompletedResult] = useState<FinalizedResultPayload | null>(null);

  const todayStr = getDailyDateString();
  const isArchiveChallenge = Boolean(queryDate && queryDate !== todayStr);

  const fetchDailyChallenge = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    const activeId = isSignedIn && user?.id ? user.id : null;
    setActiveUser(activeId);

    const targetDate = queryDate || todayStr;

    // 1. Immediately check local progress for an already completed attempt under current identity
    let progress = loadProgress(activeId);
    let localAttempt = progress.daily[targetDate];

    // If user is signed in and local record is not present, sync with cloud first
    if (
      (!localAttempt || (localAttempt.status !== "WON" && localAttempt.status !== "TIMED_OUT")) &&
      isSignedIn &&
      user?.id
    ) {
      try {
        const syncRes = await syncUserProgress(user.id);
        progress = syncRes.progress;
        localAttempt = progress.daily[targetDate];
      } catch {
        // Continue with local progress if sync encounters network issue
      }
    }

    // If this challenge date is already completed, strictly render the completion card and never start a playable game
    if (localAttempt && (localAttempt.status === "WON" || localAttempt.status === "TIMED_OUT")) {
      const puzzleResult = getDailyPuzzle(targetDate, todayStr);
      if (puzzleResult.status === "AVAILABLE") {
        const puzzle = puzzleResult.puzzle;
        const finalizedResult: FinalizedResultPayload = {
          attemptId: `att_daily_${targetDate}_${puzzle.id}_completed`,
          mode: "DAILY",
          date: targetDate,
          puzzleId: puzzle.id,
          status: localAttempt.status,
          isWon: localAttempt.status === "WON",
          finalScore: localAttempt.finalScore,
          elapsedSeconds: localAttempt.elapsedSeconds,
          hintsUsed: localAttempt.hintsUsed,
          canonicalPhrase: puzzle.answerWords.join(" "),
          solvedPhrase: localAttempt.solvedPhrase || puzzle.answerWords.join(" "),
          transformations: puzzle.transformations.map((t) => ({
            clueWord: t.clueWord,
            answerWord: t.answerWord,
            relationship: t.relationship,
            explanation: t.explanation,
          })),
          completedAt: localAttempt.completedAt || new Date().toISOString(),
        };

        setCompletedResult(finalizedResult);
        setPayload(null);
        setLoading(false);

        // Inform the server in the background so in-memory store and cookies stay aligned
        fetch("/api/game/daily/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetDate, existingAttempt: localAttempt }),
        }).catch(() => {});

        return;
      }
    }

    // 2. If unplayed, request authoritative attempt initialization from server
    try {
      const res = await fetch("/api/game/daily/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetDate, existingAttempt: localAttempt }),
      });

      const data = await res.json();

      if (data.status === "ALREADY_COMPLETED") {
        setCompletedResult(data.result);
        const { attempt } = convertFinalizedToCardProps(data.result);
        const activeId = isSignedIn && user?.id ? user.id : null;
        saveDailyAttempt(
          {
            ...attempt,
            isArchive: Boolean(queryDate && queryDate !== todayStr),
          },
          activeId
        );
        if (isSignedIn && user?.id) {
          syncUserProgress(user.id);
        }
        setPayload(null);
      } else if (data.status === "STARTED" || data.status === "IN_PROGRESS") {
        // Final sanity check before mounting playable board
        const activeId = isSignedIn && user?.id ? user.id : null;
        const recheckProgress = loadProgress(activeId);
        const recheckAttempt = recheckProgress.daily[targetDate];
        if (
          recheckAttempt &&
          (recheckAttempt.status === "WON" || recheckAttempt.status === "TIMED_OUT")
        ) {
          const puzzleResult = getDailyPuzzle(targetDate, todayStr);
          if (puzzleResult.status === "AVAILABLE") {
            const puzzle = puzzleResult.puzzle;
            setCompletedResult({
              attemptId: `att_daily_${targetDate}_${puzzle.id}_completed`,
              mode: "DAILY",
              date: targetDate,
              puzzleId: puzzle.id,
              status: recheckAttempt.status,
              isWon: recheckAttempt.status === "WON",
              finalScore: recheckAttempt.finalScore,
              elapsedSeconds: recheckAttempt.elapsedSeconds,
              hintsUsed: recheckAttempt.hintsUsed,
              canonicalPhrase: puzzle.answerWords.join(" "),
              solvedPhrase: recheckAttempt.solvedPhrase || puzzle.answerWords.join(" "),
              transformations: puzzle.transformations.map((t) => ({
                clueWord: t.clueWord,
                answerWord: t.answerWord,
                relationship: t.relationship,
                explanation: t.explanation,
              })),
              completedAt: recheckAttempt.completedAt || new Date().toISOString(),
            });
            setPayload(null);
            return;
          }
        }

        setPayload(data.payload);
        setCompletedResult(null);
      } else if (data.status === "UNAVAILABLE") {
        setErrorMsg(
          data.message ||
            (queryDate
              ? `Challenge for ${queryDate} is unavailable.`
              : "No daily challenge is available today.")
        );
      } else if (data.error) {
        setErrorMsg(data.error);
      } else {
        setErrorMsg("Failed to initialize daily challenge.");
      }
    } catch {
      setErrorMsg("Network error connecting to game server. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [queryDate, todayStr, isSignedIn, user?.id]);

  useEffect(() => {
    fetchDailyChallenge();
  }, [fetchDailyChallenge]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F7F0E5]">
        <Header />
        <main className="mx-auto flex flex-1 w-full max-w-4xl flex-col items-center justify-center p-6">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7B1E2B] border-t-transparent" />
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6B4E55]">
            Loading Today&apos;s Authoritative Challenge...
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  // Handle unavailable or unpublished daily challenge
  if (errorMsg) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-[#F7F0E5]">
        <Header />
        <main className="mx-auto flex flex-1 w-full max-w-xl flex-col justify-center px-6 py-8 text-center">
          <div className="rounded-3xl border border-[#C49A6C]/40 bg-[#FDFBF7] p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-[#32171D]">Daily Challenge Notice</h1>
            <p className="mt-2 text-sm text-[#6B4E55]">{errorMsg}</p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={fetchDailyChallenge}
                className="rounded-full border border-[#C49A6C] px-5 py-2 text-sm font-semibold text-[#32171D] hover:bg-[#faeee0] active:scale-[0.97] transition-all duration-200 ease-out cursor-pointer"
              >
                Retry
              </button>
              <Link
                href="/"
                className="rounded-full border border-[#C49A6C] px-5 py-2 text-sm font-semibold text-[#32171D] hover:bg-[#faeee0] active:scale-[0.97] transition-all duration-200 ease-out"
              >
                Home
              </Link>
              <Link
                href="/classic"
                className="rounded-full bg-[#7B1E2B] px-5 py-2 text-sm font-bold text-[#F7F0E5] hover:bg-[#631722] active:scale-[0.97] transition-all duration-200 ease-out"
              >
                Play Classic
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const currentDateDisplay = payload?.date || completedResult?.date || "Today";

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#F7F0E5]">
      <Header />
      <main className="mx-auto flex flex-1 w-full max-w-4xl flex-col gap-3 sm:gap-4 px-3.5 py-3 sm:px-8 sm:py-6">
        {/* Navigation and Top Bar */}
        <header className="flex flex-col items-center gap-2 text-center pt-2 sm:pt-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#32171D] sm:text-4xl">
              {isArchiveChallenge ? `Archive Challenge` : "Daily Flipped"}
            </h1>
            <p className="mt-1 text-xs text-[#6B4E55] sm:text-sm">
              {completedResult
                ? isArchiveChallenge
                  ? `Completed archive challenge for ${currentDateDisplay}.`
                  : `Completed official challenge for ${currentDateDisplay}.`
                : isArchiveChallenge
                ? `Playing previous daily challenge for ${currentDateDisplay}. Does not affect your daily streak.`
                : "One official challenge every day. 60 seconds to deduce the phrase."}
            </p>
          </div>
        </header>

        {/* Main Interactive or Review View */}
        <section className="my-2 sm:my-8 w-full flex-1 flex flex-col justify-center">
          {completedResult ? (
            (() => {
              const { puzzle, attempt } = convertFinalizedToCardProps(completedResult);
              return (
                <DailyCompletionCard date={currentDateDisplay} puzzle={puzzle} attempt={attempt} />
              );
            })()
          ) : payload ? (
            <ServerGameBoard
              key={payload.attemptId}
              payload={payload}
              mode="DAILY"
              onFinalized={(result) => {
                setCompletedResult(result);
                const { attempt } = convertFinalizedToCardProps(result);
                const activeId = isSignedIn && user?.id ? user.id : null;
                saveDailyAttempt(
                  {
                    ...attempt,
                    isArchive: isArchiveChallenge,
                  },
                  activeId
                );
                if (isSignedIn && user?.id) {
                  syncUserProgress(user.id);
                }
              }}
            />
          ) : null}
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default function DailyPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col bg-[#F7F0E5]">
          <Header />
          <main className="mx-auto flex flex-1 w-full max-w-4xl flex-col items-center justify-center p-6">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7B1E2B] border-t-transparent" />
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#6B4E55]">
              Loading Challenge...
            </p>
          </main>
          <Footer />
        </div>
      }
    >
      <DailyPageContent />
    </Suspense>
  );
}
