"use client";

import React from "react";
import type { Puzzle } from "../domain/types";
import { usePuzzleRound } from "../hooks/usePuzzleRound";
import { LetterGrid } from "./LetterGrid";
import { HintControl } from "./HintControl";
import { GameFeedback } from "./GameFeedback";
import { GameInstructions } from "./GameInstructions";

export interface GameBoardProps {
  readonly puzzle: Puzzle;
  readonly onPuzzleComplete?: () => void;
}

/**
 * GameBoard organizes clue displays, the interactive letter grid,
 * hint controls, and feedback summaries into a cohesive puzzle surface.
 */
export function GameBoard({ puzzle }: GameBoardProps): React.JSX.Element {
  const { state, onSelectTile, onInputLetter, onClearTile, onNavigate, onUseHint, onRestart } =
    usePuzzleRound(puzzle);

  const isRoundOver = state.status === "WON" || state.status === "TIMED_OUT";

  return (
    <div className="flex w-full flex-col items-center gap-6" data-testid="game-board">
      {/* Clues Header */}
      <section
        className="flex w-full max-w-xl flex-col items-center gap-3 rounded-2xl border border-stone-200/90 bg-white/80 p-5 shadow-sm backdrop-blur-sm"
        aria-label="Puzzle Clues"
      >
        <span className="text-xs font-semibold uppercase tracking-widest text-coral-600">
          Transform the Clues
        </span>

        <div className="flex flex-wrap items-center justify-center gap-4 text-center sm:gap-6">
          {puzzle.transformations.map((trans, idx) => (
            <div key={`clue-${idx}`} className="flex flex-col items-center">
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-stone-900">
                {trans.clueWord}
              </span>
              <span className="mt-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-semibold text-stone-600">
                {trans.relationship}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Main Interactive Letter Grid */}
      <section className="w-full" aria-label="Interactive Letter Grid">
        <LetterGrid
          grid={state.grid}
          selectedPosition={state.selectedTilePosition}
          isRoundOver={isRoundOver}
          onSelectTile={onSelectTile}
          onInputLetter={onInputLetter}
          onClearTile={onClearTile}
          onNavigate={onNavigate}
        />
      </section>

      {/* Hint Controls */}
      {!isRoundOver && (
        <section aria-label="Hint Actions">
          <HintControl
            hintsUsed={state.hintsUsed}
            isRoundOver={isRoundOver}
            onUseHint={onUseHint}
          />
        </section>
      )}

      {/* Live Status or Victory Summary */}
      <section className="w-full" aria-label="Round Status">
        <GameFeedback state={state} onRestart={onRestart} />
      </section>

      {/* Collapsible Instructions */}
      <section className="mt-4 w-full" aria-label="Instructions">
        <GameInstructions />
      </section>
    </div>
  );
}
