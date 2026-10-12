"use client";

import React from "react";
import { Sparkles, Trophy, RotateCcw } from "lucide-react";
import type { RoundState } from "../domain/types";

export interface GameFeedbackProps {
  readonly state: RoundState;
  readonly onRestart: () => void;
}

/**
 * GameFeedback displays live gameplay indicators during active rounds,
 * and presents the celebratory summary card upon winning.
 */
export function GameFeedback({ state, onRestart }: GameFeedbackProps): React.JSX.Element {
  if (state.status === "WON") {
    const { finalScore, hintsUsed, solvedPhrase } = state.terminalResult;

    return (
      <div
        className="mx-auto mt-6 w-full max-w-md rounded-2xl border border-emerald-200 bg-white/95 p-6 text-center shadow-md backdrop-blur-sm transition-all duration-300"
        role="region"
        aria-label="Round completion summary"
        data-testid="victory-banner"
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <Trophy className="h-6 w-6" aria-hidden="true" />
        </div>

        <h3 className="text-2xl font-extrabold tracking-tight text-stone-900">Puzzle Solved!</h3>

        {solvedPhrase && (
          <p className="mt-1 text-lg font-bold tracking-wider text-emerald-800">{solvedPhrase}</p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3 border-y border-stone-100 py-3 text-sm">
          <div className="rounded-lg bg-stone-50 p-2">
            <span className="text-xs text-stone-500 uppercase tracking-wider">Final Score</span>
            <p className="text-xl font-extrabold text-coral-600">{finalScore}</p>
          </div>
          <div className="rounded-lg bg-stone-50 p-2">
            <span className="text-xs text-stone-500 uppercase tracking-wider">Hints Used</span>
            <p className="text-xl font-bold text-stone-800">{hintsUsed}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRestart}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-coral-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-coral-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-500 focus-visible:ring-offset-2"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          <span>Play Fresh Round</span>
        </button>
      </div>
    );
  }

  // Active round live status
  return (
    <div className="flex items-center justify-center gap-2 text-xs font-medium text-stone-500">
      <Sparkles className="h-3.5 w-3.5 text-coral-500" aria-hidden="true" />
      <span>Auto-detecting answers as you type</span>
    </div>
  );
}
