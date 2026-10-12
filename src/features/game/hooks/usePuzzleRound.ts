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
} from "../domain/round-state";
import { getNextEditablePosition, getPreviousEditablePosition } from "../domain/letter-grid";

export interface UsePuzzleRoundReturn {
  readonly state: RoundState;
  readonly isInputFocused: boolean;
  readonly onSelectTile: (position: TilePosition | null) => void;
  readonly onInputLetter: (letter: string) => void;
  readonly onClearTile: () => void;
  readonly onNavigate: (direction: "left" | "right" | "up" | "down" | "home" | "end") => void;
  readonly onUseHint: () => { success: boolean; message: string };
  readonly onRestart: () => void;
  readonly setInputFocused: (focused: boolean) => void;
}

/**
 * React hook wrapping the pure game engine.
 * Maintains state immutability, coordinates tile navigation,
 * and provides handlers for keyboard, touch, and hint interactions.
 */
export function usePuzzleRound(puzzle: Puzzle): UsePuzzleRoundReturn {
  const [state, setState] = useState<RoundState>(() => createInitialRoundState(puzzle));
  const [isInputFocused, setInputFocused] = useState<boolean>(false);
  const stateRef = useRef<RoundState>(state);

  // Keep stateRef in sync with state for stale-closure prevention
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // When puzzle changes, reset the round state cleanly
  useEffect(() => {
    setState(createInitialRoundState(puzzle));
  }, [puzzle]);

  const onSelectTile = useCallback((position: TilePosition | null) => {
    setState((prev) => selectTile(prev, position));
  }, []);

  const onInputLetter = useCallback((rawLetter: string) => {
    const currentState = stateRef.current;
    if (currentState.status === "WON" || currentState.status === "TIMED_OUT") {
      return;
    }

    const pos = currentState.selectedTilePosition;
    if (!pos) {
      return;
    }

    setState((prev) => {
      const activePos = prev.selectedTilePosition;
      if (!activePos) return prev;
      return applyLetterInput(prev, activePos, rawLetter);
    });
  }, []);

  const onClearTile = useCallback(() => {
    const currentState = stateRef.current;
    if (currentState.status === "WON" || currentState.status === "TIMED_OUT") {
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
        if (!activePos) return prev;
        return applyTileClear(prev, activePos);
      });
    } else {
      // Tile is already empty: move to previous editable tile and clear it
      const prevPos = getPreviousEditablePosition(currentState.grid, pos);
      if (prevPos) {
        setState((prev) => {
          const cleared = applyTileClear(prev, prevPos);
          return selectTile(cleared, prevPos);
        });
      }
    }
  }, []);

  const onNavigate = useCallback((direction: "left" | "right" | "up" | "down" | "home" | "end") => {
    const currentState = stateRef.current;
    if (currentState.status === "WON" || currentState.status === "TIMED_OUT") {
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
          // Move from Word 1 to Word 0 at same letterIndex (or nearest editable)
          const targetWordLength = currentState.grid.words[0].length;
          const targetIndex = Math.min(letterIndex, targetWordLength - 1);
          const targetTile = currentState.grid.words[0][targetIndex];

          if (targetTile && !targetTile.isFixed) {
            setState((s) => selectTile(s, { wordIndex: 0, letterIndex: targetIndex }));
          } else {
            // Target is fixed (e.g. index 0), pick first editable
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
          // Move from Word 0 to Word 1 at same letterIndex (or nearest editable)
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
        // Move to first editable tile in current word
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
        // Move to last editable tile in current word
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
    if (currentState.status === "WON" || currentState.status === "TIMED_OUT") {
      return { success: false, message: "Round has already concluded." };
    }

    const updated = applyHintToRound(currentState);
    if (updated.hintsUsed === currentState.hintsUsed) {
      return { success: false, message: "No eligible tiles left to reveal." };
    }

    setState(updated);
    return {
      success: true,
      message: `Hint revealed an answer letter! (-5 points penalty).`,
    };
  }, []);

  const onRestart = useCallback(() => {
    setState(resetRound(puzzle));
  }, [puzzle]);

  return {
    state,
    isInputFocused,
    onSelectTile,
    onInputLetter,
    onClearTile,
    onNavigate,
    onUseHint,
    onRestart,
    setInputFocused,
  };
}
