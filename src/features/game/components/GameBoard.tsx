"use client";

import React, { useState, useEffect, useRef } from "react";
import type { Puzzle } from "../domain/types";
import type { GameMode } from "../modes/mode-types";
import { saveDailyAttempt, recordClassicGame } from "../persistence/local-progress";
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
  readonly mode?: GameMode;
  readonly date?: string;
  readonly onNextPuzzle?: () => void;
  readonly nextPuzzleLabel?: string;
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
  mode,
  date,
  onNextPuzzle,
  nextPuzzleLabel,
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

  const hasRecordedProgressRef = useRef<boolean>(false);
  const [showWinModal, setShowWinModal] = useState<boolean>(true);

  // Reset recording ref if puzzle changes
  useEffect(() => {
    hasRecordedProgressRef.current = false;
    setShowWinModal(true);
  }, [puzzle.id]);

  const isPlaying = state.status === "PLAYING";
  const isRoundOver = state.status === "WON" || state.status === "TIMED_OUT";
  const isGridDisabled = !isPlaying; // Disabled in READY, WON, and TIMED_OUT

  // Trigger completion callback and persist result when round terminates
  useEffect(() => {
    if (state.status === "WON" && onPuzzleComplete) {
      onPuzzleComplete();
    }

    if (
      (state.status === "WON" || state.status === "TIMED_OUT") &&
      !hasRecordedProgressRef.current
    ) {
      hasRecordedProgressRef.current = true;

      const solvedPhrase =
        state.status === "WON" ? state.terminalResult.solvedPhrase : puzzle.answerWords.join(" ");

      if (mode === "DAILY" && date) {
        saveDailyAttempt({
          date,
          puzzleId: puzzle.id,
          status: state.status,
          finalScore: state.status === "WON" ? state.score : 0,
          elapsedSeconds: timer.elapsedSeconds,
          hintsUsed: state.hintsUsed,
          solvedPhrase: solvedPhrase ?? puzzle.answerWords.join(" "),
          completedAt: new Date().toISOString(),
        });
      } else if (mode === "CLASSIC") {
        recordClassicGame(
          puzzle.id,
          puzzle.difficulty,
          state.status === "WON",
          state.status === "WON" ? state.score : 0,
          timer.elapsedSeconds
        );
      }
    }
  }, [state, timer.elapsedSeconds, puzzle, mode, date, onPuzzleComplete]);

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

      {/* Winning Pop-up Modal Dialog */}
      {showWinModal && state.status === "WON" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Victory Summary"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in"
        >
          <div className="relative w-full max-w-lg my-8">
            <button
              type="button"
              onClick={() => setShowWinModal(false)}
              aria-label="Close victory popup"
              className="absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#32171D] text-[#F7F0E5] border border-[#C49A6C] shadow-md hover:bg-[#7B1E2B] transition-all duration-200 ease-out active:scale-[0.92] text-sm font-bold cursor-pointer"
            >
              ✕
            </button>
            <SuccessScreen
              puzzle={puzzle}
              terminalResult={state.terminalResult}
              onPlayAgain={() => {
                setShowWinModal(false);
                onPlayAgain();
              }}
              mode={mode}
              onNextPuzzle={
                onNextPuzzle
                  ? () => {
                      setShowWinModal(false);
                      onNextPuzzle();
                    }
                  : undefined
              }
              nextPuzzleLabel={nextPuzzleLabel}
            />
          </div>
        </div>
      )}

      {/* Result Screens or Live Status */}
      <section className="w-full" aria-label="Round Status & Results">
        {state.status === "WON" && !showWinModal && (
          <SuccessScreen
            puzzle={puzzle}
            terminalResult={state.terminalResult}
            onPlayAgain={onPlayAgain}
            mode={mode}
            onNextPuzzle={onNextPuzzle}
            nextPuzzleLabel={nextPuzzleLabel}
          />
        )}

        {state.status === "TIMED_OUT" && (
          <TimeoutScreen
            puzzle={puzzle}
            terminalResult={state.terminalResult}
            onPlayAgain={onPlayAgain}
            mode={mode}
            onNextPuzzle={onNextPuzzle}
            nextPuzzleLabel={nextPuzzleLabel}
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
