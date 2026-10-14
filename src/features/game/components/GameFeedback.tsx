"use client";

import React from "react";
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
        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
          Puzzle Solved!
        </span>

        {solvedPhrase && (
          <p className="mt-3 text-lg font-bold tracking-wider text-emerald-800">{solvedPhrase}</p>
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
          className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-coral-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-coral-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-500 focus-visible:ring-offset-2 cursor-pointer"
        >
          Play Fresh Round
        </button>
      </div>
    );
  }

  // Active round live status
  return (
    <div className="flex items-center justify-center gap-2 text-xs font-medium text-stone-500">
      <span>Auto-detecting answers as you type</span>
    </div>
  );
}
