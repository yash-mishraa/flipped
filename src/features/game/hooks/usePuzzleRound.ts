"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Puzzle, RoundState, TilePosition } from "../domain/types";
import {
  applyHintToRound,
  applyLetterInput,
  applyTileClear,
  createInitialRoundState,
  resetRound,
  selectTile,
  startRound,
  tickTimer,
  timeOutRound,
} from "../domain/round-state";
import { getNextEditablePosition, getPreviousEditablePosition } from "../domain/letter-grid";
import { DEFAULT_ROUND_DURATION_SECONDS } from "../domain/timer-utils";
import { useGameTimer, type UseGameTimerReturn } from "./useGameTimer";

export interface UsePuzzleRoundOptions {
  readonly autoStart?: boolean;
  readonly durationSeconds?: number;
}

export interface UsePuzzleRoundReturn {
  readonly state: RoundState;
  readonly timer: UseGameTimerReturn;
  readonly isInputFocused: boolean;
  readonly onStartRound: () => void;
  readonly onSelectTile: (position: TilePosition | null) => void;
  readonly onInputLetter: (letter: string) => void;
  readonly onClearTile: () => void;
  readonly onNavigate: (direction: "left" | "right" | "up" | "down" | "home" | "end") => void;
  readonly onUseHint: () => { success: boolean; message: string };
  readonly onRestart: () => void;
  readonly onPlayAgain: () => void;
  readonly setInputFocused: (focused: boolean) => void;
}

/**
 * React hook wrapping the pure game engine with countdown timer orchestration.
 * Maintains state immutability, coordinates tile navigation,
 * and provides handlers for keyboard, touch, hint, and timer lifecycle events.
 */
export function usePuzzleRound(
  puzzle: Puzzle,
  options: UsePuzzleRoundOptions = {}
): UsePuzzleRoundReturn {
  const { autoStart = false, durationSeconds = DEFAULT_ROUND_DURATION_SECONDS } = options;

  const [state, setState] = useState<RoundState>(() => createInitialRoundState(puzzle));
  const [isInputFocused, setInputFocused] = useState<boolean>(false);
  const stateRef = useRef<RoundState>(state);

  // Keep stateRef in sync with state for stale-closure prevention
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const handleTimerTick = useCallback((elapsedSeconds: number) => {
    setState((prev) => {
      if (prev.status !== "PLAYING") {
        return prev;
      }
      return tickTimer(prev, elapsedSeconds);
    });
  }, []);

  const handleTimerExpire = useCallback(() => {
    setState((prev) => {
      if (prev.status === "WON" || prev.status === "TIMED_OUT") {
        return prev;
      }
      return timeOutRound(prev);
    });
  }, []);

  const timer = useGameTimer({
    durationSeconds,
    tickIntervalMs: 100,
    onTick: handleTimerTick,
    onExpire: handleTimerExpire,
  });

  const timerRef = useRef(timer);
  timerRef.current = timer;

  // When puzzle changes, reset the round state and timer cleanly
  useEffect(() => {
    timerRef.current.reset(durationSeconds);
    setState(createInitialRoundState(puzzle));
  }, [puzzle, durationSeconds]);

  // Ensure timer stops immediately when terminal state is reached
  useEffect(() => {
    if (state.status === "WON" || state.status === "TIMED_OUT") {
      timerRef.current.stop();
    }
  }, [state.status]);

  const onStartRound = useCallback(() => {
    const currentState = stateRef.current;
    if (currentState.status !== "READY") {
      return;
    }

    setState((prev) => (prev.status === "READY" ? startRound(prev) : prev));
    timerRef.current.start();
  }, []);

  // Handle autoStart option if configured
  useEffect(() => {
    if (autoStart && state.status === "READY") {
      onStartRound();
    }
  }, [autoStart, state.status, onStartRound]);

  const onSelectTile = useCallback(
    (position: TilePosition | null) => {
      setState((prev) => {
        // In READY state, do not allow focusing tiles until round starts unless autoStart is active
        if (prev.status === "READY" && !autoStart) {
          return prev;
        }
        return selectTile(prev, position);
      });
    },
    [autoStart]
  );

  const onInputLetter = useCallback(
    (rawLetter: string) => {
      const currentState = stateRef.current;

      // In READY state without autoStart, ignore letter input until player starts
      if (currentState.status === "READY") {
        if (autoStart) {
          onStartRound();
        } else {
          return;
        }
      }

      if (currentState.status === "WON" || currentState.status === "TIMED_OUT") {
        return;
      }

      // Authoritative deadline check: reject win if submitted at or after deadline
      const remainingMs = timerRef.current.getAuthoritativeRemainingMs();
      if (remainingMs <= 0) {
        timerRef.current.stop();
        setState((prev) => (prev.status === "PLAYING" ? timeOutRound(prev) : prev));
        return;
      }

      const pos = currentState.selectedTilePosition;
      if (!pos) {
        return;
      }

      setState((prev) => {
        const activePos = prev.selectedTilePosition;
        if (!activePos || prev.status !== "PLAYING") return prev;

        const updated = applyLetterInput(prev, activePos, rawLetter);
        if (updated.status === "WON") {
          timerRef.current.stop();
        }
        return updated;
      });
    },
    [autoStart, onStartRound]
  );

  const onClearTile = useCallback(() => {
    const currentState = stateRef.current;
    if (currentState.status !== "PLAYING") {
      return;
    }

    const pos = currentState.selectedTilePosition;
    if (!pos) {
      return;
    }

    const currentTile = currentState.grid.words[pos.wordIndex][pos.letterIndex];

    if (currentTile && currentTile.letter) {
      // Tile has a letter: clear current tile
      setState((prev) => {
        const activePos = prev.selectedTilePosition;
        if (!activePos || prev.status !== "PLAYING") return prev;
        return applyTileClear(prev, activePos);
      });
    } else {
      // Tile is already empty: move to previous editable tile and clear it
      const prevPos = getPreviousEditablePosition(currentState.grid, pos);
      if (prevPos) {
        setState((prev) => {
          if (prev.status !== "PLAYING") return prev;
          const cleared = applyTileClear(prev, prevPos);
          return selectTile(cleared, prevPos);
        });
      }
    }
  }, []);

  const onNavigate = useCallback((direction: "left" | "right" | "up" | "down" | "home" | "end") => {
    const currentState = stateRef.current;
    if (currentState.status !== "PLAYING") {
      return;
    }

    const pos = currentState.selectedTilePosition;
    if (!pos) {
      return;
    }

    const { wordIndex, letterIndex } = pos;

    switch (direction) {
      case "left": {
        const prev = getPreviousEditablePosition(currentState.grid, pos);
        if (prev) {
          setState((s) => selectTile(s, prev));
        }
        break;
      }

      case "right": {
        const next = getNextEditablePosition(currentState.grid, pos);
        if (next) {
          setState((s) => selectTile(s, next));
        }
        break;
      }

      case "up": {
        if (wordIndex === 1) {
          const targetWordLength = currentState.grid.words[0].length;
          const targetIndex = Math.min(letterIndex, targetWordLength - 1);
          const targetTile = currentState.grid.words[0][targetIndex];

          if (targetTile && !targetTile.isFixed) {
            setState((s) => selectTile(s, { wordIndex: 0, letterIndex: targetIndex }));
          } else {
            const nextEditable = getNextEditablePosition(currentState.grid, {
              wordIndex: 0,
              letterIndex: 0,
            });
            if (nextEditable && nextEditable.wordIndex === 0) {
              setState((s) => selectTile(s, nextEditable));
            }
          }
        }
        break;
      }

      case "down": {
        if (wordIndex === 0) {
          const targetWordLength = currentState.grid.words[1].length;
          const targetIndex = Math.min(letterIndex, targetWordLength - 1);
          const targetTile = currentState.grid.words[1][targetIndex];

          if (targetTile && !targetTile.isFixed) {
            setState((s) => selectTile(s, { wordIndex: 1, letterIndex: targetIndex }));
          } else {
            const nextEditable = getNextEditablePosition(currentState.grid, {
              wordIndex: 1,
              letterIndex: 0,
            });
            if (nextEditable && nextEditable.wordIndex === 1) {
              setState((s) => selectTile(s, nextEditable));
            }
          }
        }
        break;
      }

      case "home": {
        const tiles = currentState.grid.words[wordIndex];
        for (let i = 0; i < tiles.length; i++) {
          if (!tiles[i]?.isFixed) {
            setState((s) => selectTile(s, { wordIndex, letterIndex: i }));
            break;
          }
        }
        break;
      }

      case "end": {
        const tiles = currentState.grid.words[wordIndex];
        for (let i = tiles.length - 1; i >= 0; i--) {
          if (!tiles[i]?.isFixed) {
            setState((s) => selectTile(s, { wordIndex, letterIndex: i }));
            break;
          }
        }
        break;
      }
    }
  }, []);

  const onUseHint = useCallback((): { success: boolean; message: string } => {
    const currentState = stateRef.current;
    if (currentState.status !== "PLAYING") {
      if (currentState.status === "READY") {
        return { success: false, message: "Start the round before using hints." };
      }
      return { success: false, message: "Round has already concluded." };
    }

    // Authoritative deadline check
    if (timerRef.current.getAuthoritativeRemainingMs() <= 0) {
      timerRef.current.stop();
      setState((prev) => (prev.status === "PLAYING" ? timeOutRound(prev) : prev));
      return { success: false, message: "Time has expired." };
    }

    const updated = applyHintToRound(currentState);
    if (updated.hintsUsed === currentState.hintsUsed) {
      return { success: false, message: "No eligible tiles left to reveal." };
    }

    if (updated.status === "WON") {
      timerRef.current.stop();
    }

    setState(updated);
    return {
      success: true,
      message: "Hint revealed an answer letter! (-5 points penalty).",
    };
  }, []);

  const onRestart = useCallback(() => {
    timerRef.current.reset(durationSeconds);
    setState(resetRound(puzzle));
  }, [puzzle, durationSeconds]);

  const onPlayAgain = useCallback(() => {
    timerRef.current.reset(durationSeconds);
    setState(resetRound(puzzle));
  }, [puzzle, durationSeconds]);

  return {
    state,
    timer,
    isInputFocused,
    onStartRound,
    onSelectTile,
    onInputLetter,
    onClearTile,
    onNavigate,
    onUseHint,
    onRestart,
    onPlayAgain,
    setInputFocused,
  };
}
