"use client";

import React, { useEffect } from "react";
import type { Puzzle } from "../domain/types";
import { usePuzzleRound } from "../hooks/usePuzzleRound";
import { LetterGrid } from "./LetterGrid";
import { HintControl } from "./HintControl";
import { GameHUD } from "./GameHUD";
import { GameFeedback } from "./GameFeedback";
import { SuccessScreen } from "./SuccessScreen";
import { TimeoutScreen } from "./TimeoutScreen";
import { GameInstructions } from "./GameInstructions";

export interface GameBoardProps {
  readonly puzzle: Puzzle;
  readonly autoStart?: boolean;
  readonly durationSeconds?: number;
  readonly onPuzzleComplete?: () => void;
}

/**
 * GameBoard organizes clue displays, countdown timer, interactive letter grid,
 * hint controls, and terminal outcome screens into a cohesive puzzle surface.
 */
export function GameBoard({
  puzzle,
  autoStart = false,
  durationSeconds,
  onPuzzleComplete,
}: GameBoardProps): React.JSX.Element {
  const {
    state,
    timer,
    onStartRound,
    onSelectTile,
    onInputLetter,
    onClearTile,
    onNavigate,
    onUseHint,
    onRestart,
    onPlayAgain,
  } = usePuzzleRound(puzzle, { autoStart, durationSeconds });

  const isPlaying = state.status === "PLAYING";
  const isRoundOver = state.status === "WON" || state.status === "TIMED_OUT";
  const isGridDisabled = !isPlaying; // Disabled in READY, WON, and TIMED_OUT

  // Trigger completion callback if provided
  useEffect(() => {
    if (state.status === "WON" && onPuzzleComplete) {
      onPuzzleComplete();
    }
  }, [state.status, onPuzzleComplete]);

  return (
    <div className="flex w-full flex-col items-center gap-6" data-testid="game-board">
      {/* Top HUD with Timer, Clues, Score, and Start Control */}
      <GameHUD
        puzzle={puzzle}
        roundStatus={state.status}
        formattedTime={timer.formattedTime}
        urgency={timer.urgency}
        isRunning={timer.isRunning}
        score={state.score}
        hintsUsed={state.hintsUsed}
        onStartGame={onStartRound}
        onRestart={onRestart}
      />

      {/* Main Interactive Letter Grid (Preserved on terminal states, disabled when not playing) */}
      <section className="w-full" aria-label="Interactive Letter Grid">
        <LetterGrid
          grid={state.grid}
          selectedPosition={state.selectedTilePosition}
          isRoundOver={isGridDisabled}
          onSelectTile={onSelectTile}
          onInputLetter={onInputLetter}
          onClearTile={onClearTile}
          onNavigate={onNavigate}
        />
      </section>

      {/* Hint Controls (Active during PLAYING only) */}
      {isPlaying && (
        <section aria-label="Hint Actions">
          <HintControl
            hintsUsed={state.hintsUsed}
            isRoundOver={isRoundOver}
            onUseHint={onUseHint}
          />
        </section>
      )}

      {/* Result Screens or Live Status */}
      <section className="w-full" aria-label="Round Status & Results">
        {state.status === "WON" && (
          <SuccessScreen
            puzzle={puzzle}
            terminalResult={state.terminalResult}
            onPlayAgain={onPlayAgain}
          />
        )}

        {state.status === "TIMED_OUT" && (
          <TimeoutScreen
            puzzle={puzzle}
            terminalResult={state.terminalResult}
            onPlayAgain={onPlayAgain}
          />
        )}

        {isPlaying && <GameFeedback state={state} onRestart={onRestart} />}
      </section>

      {/* Collapsible Instructions & Feedback Legend */}
      <section className="mt-2 w-full" aria-label="Instructions">
        <GameInstructions />
      </section>
    </div>
  );
}
