"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, AlertCircle, RotateCcw } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ServerGameBoard } from "@/features/game/components/ServerGameBoard";
import { DailyCompletionCard } from "@/features/game/components/DailyCompletionCard";
import { saveDailyAttempt } from "@/features/game/persistence/local-progress";
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
  };

  return { puzzle, attempt };
}

export default function DailyPage(): React.JSX.Element {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [payload, setPayload] = useState<SafeGameplayPayload | null>(null);
  const [completedResult, setCompletedResult] = useState<FinalizedResultPayload | null>(null);

  const fetchDailyChallenge = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/game/daily/start", {
        method: "POST",
      });

      const data = await res.json();

      if (data.status === "ALREADY_COMPLETED") {
        setCompletedResult(data.result);
        const { attempt } = convertFinalizedToCardProps(data.result);
        saveDailyAttempt(attempt);
        setPayload(null);
      } else if (data.status === "STARTED" || data.status === "IN_PROGRESS") {
        setPayload(data.payload);
        setCompletedResult(null);
      } else if (data.status === "UNAVAILABLE") {
        setErrorMsg(data.message || "No daily challenge is available today.");
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
  }, []);

  useEffect(() => {
    fetchDailyChallenge();
  }, [fetchDailyChallenge]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#fcfbf9]">
        <Header />
        <main className="mx-auto flex flex-1 w-full max-w-4xl flex-col items-center justify-center p-6">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-coral-500 border-t-transparent" />
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-stone-400">
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
      <div className="flex min-h-screen flex-col bg-[#fcfbf9]">
        <Header />
        <main className="mx-auto flex flex-1 w-full max-w-xl flex-col justify-center px-6 py-12 text-center">
          <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-600">
              <AlertCircle className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-stone-900">Daily Challenge Notice</h1>
            <p className="mt-2 text-sm text-stone-600">{errorMsg}</p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={fetchDailyChallenge}
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Retry</span>
              </button>
              <Link
                href="/"
                className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
              >
                Home
              </Link>
              <Link
                href="/classic"
                className="rounded-xl bg-coral-500 px-4 py-2 text-sm font-bold text-white hover:bg-coral-600"
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
    <div className="flex min-h-screen flex-col bg-[#fcfbf9]">
      <Header />
      <main className="mx-auto flex flex-1 w-full max-w-4xl flex-col justify-between px-4 py-8 sm:px-8 sm:py-12">
        {/* Navigation and Top Bar */}
        <header className="flex flex-col items-center gap-4 text-center">
          <div className="flex w-full items-center justify-between border-b border-stone-200/80 pb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 active:scale-95"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Home</span>
            </Link>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-coral-200 bg-coral-50 px-3 py-1 text-xs font-semibold text-coral-700">
              <Calendar className="h-3.5 w-3.5 text-coral-600" aria-hidden="true" />
              <span>Daily Challenge • {currentDateDisplay}</span>
            </div>

            <Link
              href="/archive"
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 active:scale-95"
            >
              <span>Archive</span>
            </Link>
          </div>

          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
              Daily Flipped
            </h1>
            <p className="mt-1 text-xs text-stone-500 sm:text-sm">
              One official challenge every day. 60 seconds to deduce the phrase.
            </p>
          </div>
        </header>

        {/* Main Interactive or Review View */}
        <section className="my-8 w-full flex-1 flex flex-col justify-center">
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
                saveDailyAttempt(attempt);
              }}
            />
          ) : null}
        </section>

        {/* Footer Notice */}
        <footer className="border-t border-stone-200/80 pt-4 text-center text-xs text-stone-500">
          <p>
            Flipped Daily Challenge • Authoritative Server Verification • Single attempt per day
          </p>
        </footer>
      </main>
      <Footer />
    </div>
  );
}
