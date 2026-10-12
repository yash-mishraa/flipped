import type {
  PlayingRoundState,
  Puzzle,
  ReadyRoundState,
  RoundState,
  TilePosition,
  TimedOutRoundState,
  WonRoundState,
} from "./types";
import {
  clearTile,
  createInitialGrid,
  enterLetter,
  getFirstEditablePosition,
  getNextEditablePosition,
  getPhraseString,
} from "./letter-grid";
import { checkGridAnswer } from "./check-answer";
import { calculateScore } from "./scoring";
import { applyHintToGrid, selectNextHint } from "./hints";

/**
 * Generates a unique identifier for a puzzle round.
 */
export function generateRoundId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `round-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Creates the initial round state in READY lifecycle status.
 */
export function createInitialRoundState(puzzle: Puzzle, roundId?: string): ReadyRoundState {
  const grid = createInitialGrid(puzzle);
  const initialPosition = getFirstEditablePosition(grid);

  return {
    roundId: roundId ?? generateRoundId(),
    status: "READY",
    puzzle,
    grid,
    hintsUsed: 0,
    elapsedSeconds: 0,
    score: calculateScore(0, 0),
    selectedTilePosition: initialPosition,
    lastValidationResult: null,
  };
}

/**
 * Transitions a round from READY to PLAYING.
 * Idempotent if already PLAYING; rejects if already in a terminal state.
 */
export function startRound(state: RoundState): PlayingRoundState {
  if (state.status === "PLAYING") {
    return state;
  }

  if (state.status === "WON" || state.status === "TIMED_OUT") {
    throw new Error(
      `Cannot start a round that has already ended with status '${state.status}'. Create a new round state instead.`
    );
  }

  return {
    roundId: state.roundId,
    status: "PLAYING",
    puzzle: state.puzzle,
    grid: state.grid,
    hintsUsed: state.hintsUsed,
    elapsedSeconds: state.elapsedSeconds,
    score: state.score,
    selectedTilePosition: state.selectedTilePosition,
    lastValidationResult: state.lastValidationResult,
  };
}

/**
 * Purely applies letter input into the active grid cell.
 * Automatically initiates PLAYING if currently READY.
 * Automatically checks for puzzle completion; transitions to WON if all conditions match.
 * Rejects input if round has ended.
 */
export function applyLetterInput(
  state: RoundState,
  position: TilePosition,
  rawLetter: string
): RoundState {
  if (state.status === "WON" || state.status === "TIMED_OUT") {
    return state;
  }

  const activePlayingState: PlayingRoundState =
    state.status === "READY" ? startRound(state) : state;

  const updatedGrid = enterLetter(
    activePlayingState.grid,
    activePlayingState.puzzle,
    position,
    rawLetter
  );

  const validation = checkGridAnswer(activePlayingState.puzzle, updatedGrid);

  // Automatic Answer Detection: Winning condition triggered immediately
  if (validation.isMatch) {
    const finalScore = calculateScore(
      activePlayingState.elapsedSeconds,
      activePlayingState.hintsUsed
    );

    const wonState: WonRoundState = {
      roundId: activePlayingState.roundId,
      status: "WON",
      puzzle: activePlayingState.puzzle,
      grid: updatedGrid,
      hintsUsed: activePlayingState.hintsUsed,
      elapsedSeconds: activePlayingState.elapsedSeconds,
      score: finalScore,
      selectedTilePosition: null,
      lastValidationResult: validation,
      terminalResult: {
        roundId: activePlayingState.roundId,
        status: "WON",
        finalScore,
        elapsedSeconds: activePlayingState.elapsedSeconds,
        hintsUsed: activePlayingState.hintsUsed,
        completedAt: new Date().toISOString(),
        solvedPhrase: getPhraseString(updatedGrid),
      },
    };

    return wonState;
  }

  // Advance cursor to next editable tile if input was successfully registered
  const nextPos = getNextEditablePosition(updatedGrid, position) ?? position;

  return {
    ...activePlayingState,
    grid: updatedGrid,
    selectedTilePosition: nextPos,
    lastValidationResult: validation,
  };
}

/**
 * Purely clears an editable tile.
 * Rejects operations if round has ended.
 */
export function applyTileClear(state: RoundState, position: TilePosition): RoundState {
  if (state.status === "WON" || state.status === "TIMED_OUT") {
    return state;
  }

  const activeState: PlayingRoundState = state.status === "READY" ? startRound(state) : state;
  const updatedGrid = clearTile(activeState.grid, activeState.puzzle, position);
  const validation = checkGridAnswer(activeState.puzzle, updatedGrid);

  return {
    ...activeState,
    grid: updatedGrid,
    selectedTilePosition: position,
    lastValidationResult: validation,
  };
}

/**
 * Purely updates the currently focused tile position.
 * Rejects selection if round has ended.
 */
export function selectTile(state: RoundState, position: TilePosition | null): RoundState {
  if (state.status === "WON" || state.status === "TIMED_OUT") {
    return state;
  }

  if (position) {
    const tile = state.grid.words[position.wordIndex][position.letterIndex];
    if (tile?.isFixed) {
      // Do not allow selecting fixed clue tiles
      return state;
    }
  }

  return {
    ...state,
    selectedTilePosition: position,
  };
}

/**
 * Updates the elapsed time and recomputes the score.
 * Freezes timer and score if round is already in a terminal state.
 */
export function tickTimer(state: RoundState, elapsedSeconds: number): RoundState {
  if (state.status === "WON" || state.status === "TIMED_OUT") {
    return state;
  }

  if (state.status === "READY") {
    return state;
  }

  const updatedScore = calculateScore(elapsedSeconds, state.hintsUsed);

  return {
    ...state,
    elapsedSeconds,
    score: updatedScore,
  };
}

/**
 * Selects and applies a hint to the grid, deducting the hint penalty from the score.
 * Automatically checks for puzzle completion if the hint solves the last remaining letter.
 */
export function applyHintToRound(state: RoundState): RoundState {
  if (state.status === "WON" || state.status === "TIMED_OUT") {
    return state;
  }

  const activeState: PlayingRoundState = state.status === "READY" ? startRound(state) : state;

  const hintResult = selectNextHint(activeState.grid, activeState.puzzle);
  if (!hintResult.success) {
    return activeState;
  }

  const updatedGrid = applyHintToGrid(activeState.grid, activeState.puzzle, {
    position: hintResult.position,
    letter: hintResult.letter,
  });

  const updatedHintsUsed = activeState.hintsUsed + 1;
  const updatedScore = calculateScore(activeState.elapsedSeconds, updatedHintsUsed);
  const validation = checkGridAnswer(activeState.puzzle, updatedGrid);

  if (validation.isMatch) {
    const wonState: WonRoundState = {
      roundId: activeState.roundId,
      status: "WON",
      puzzle: activeState.puzzle,
      grid: updatedGrid,
      hintsUsed: updatedHintsUsed,
      elapsedSeconds: activeState.elapsedSeconds,
      score: updatedScore,
      selectedTilePosition: null,
      lastValidationResult: validation,
      terminalResult: {
        roundId: activeState.roundId,
        status: "WON",
        finalScore: updatedScore,
        elapsedSeconds: activeState.elapsedSeconds,
        hintsUsed: updatedHintsUsed,
        completedAt: new Date().toISOString(),
        solvedPhrase: getPhraseString(updatedGrid),
      },
    };

    return wonState;
  }

  return {
    ...activeState,
    grid: updatedGrid,
    hintsUsed: updatedHintsUsed,
    score: updatedScore,
    lastValidationResult: validation,
  };
}

/**
 * Terminates an active round due to time expiration.
 * Terminal states cannot be reversed.
 */
export function timeOutRound(state: RoundState): TimedOutRoundState {
  if (state.status === "WON") {
    throw new Error("Cannot time out a round that was already won.");
  }

  if (state.status === "TIMED_OUT") {
    return state;
  }

  const practiceScore = calculateScore(state.elapsedSeconds, state.hintsUsed);

  return {
    roundId: state.roundId,
    status: "TIMED_OUT",
    puzzle: state.puzzle,
    grid: state.grid,
    hintsUsed: state.hintsUsed,
    elapsedSeconds: state.elapsedSeconds,
    score: practiceScore,
    selectedTilePosition: null,
    lastValidationResult: state.lastValidationResult,
    terminalResult: {
      roundId: state.roundId,
      status: "TIMED_OUT",
      finalScore: practiceScore,
      practiceScore,
      elapsedSeconds: state.elapsedSeconds,
      hintsUsed: state.hintsUsed,
      completedAt: new Date().toISOString(),
    },
  };
}

/**
 * Resets the round state back to READY with a fresh grid and reset counters.
 */
export function resetRound(puzzle: Puzzle, newRoundId?: string): ReadyRoundState {
  return createInitialRoundState(puzzle, newRoundId ?? generateRoundId());
}
