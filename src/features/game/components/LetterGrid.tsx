"use client";

import React, { useCallback, useEffect, useRef } from "react";
import type { LetterGrid as GridModel, TilePosition } from "../domain/types";
import { LetterTile } from "./LetterTile";

export interface LetterGridProps {
  readonly grid: GridModel;
  readonly selectedPosition: TilePosition | null;
  readonly isRoundOver: boolean;
  readonly onSelectTile: (position: TilePosition) => void;
  readonly onInputLetter: (letter: string) => void;
  readonly onClearTile: () => void;
  readonly onNavigate: (direction: "left" | "right" | "up" | "down" | "home" | "end") => void;
  readonly onEnter?: () => void;
}

/**
 * LetterGrid renders the two answer words as separate tile groups.
 * Provides unified, accessible keyboard and mobile-touch interaction.
 */
export function LetterGrid({
  grid,
  selectedPosition,
  isRoundOver,
  onSelectTile,
  onInputLetter,
  onClearTile,
  onNavigate,
  onEnter,
}: LetterGridProps): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  const lastActionTimeRef = useRef<number>(0);
  const lastActionTypeRef = useRef<string>("");

  const resetInputValue = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.value = " ";
      try {
        inputRef.current.setSelectionRange(1, 1);
      } catch {
        // Safe fallback in environments without selection support
      }
    }
  }, []);

  // Keep hidden input focused and primed with sentinel space when an editable tile is selected
  useEffect(() => {
    if (selectedPosition && !isRoundOver && inputRef.current) {
      if (inputRef.current.value !== " ") {
        resetInputValue();
      }
      inputRef.current.focus({ preventScroll: true });
    }
  }, [selectedPosition, isRoundOver, resetInputValue]);

  const executeVirtualClear = useCallback(() => {
    const now = Date.now();
    // Drop duplicate clear calls fired within 60ms from the same physical tap across keydown/beforeinput/input
    if (lastActionTypeRef.current === "BACKSPACE" && now - lastActionTimeRef.current < 60) {
      resetInputValue();
      return;
    }
    lastActionTimeRef.current = now;
    lastActionTypeRef.current = "BACKSPACE";
    onClearTile();
    resetInputValue();
  }, [onClearTile, resetInputValue]);

  const executeVirtualInput = useCallback(
    (char: string) => {
      const now = Date.now();
      // Drop duplicate input calls fired within 60ms from the same physical tap for the same character
      if (lastActionTypeRef.current === char && now - lastActionTimeRef.current < 60) {
        resetInputValue();
        return;
      }
      lastActionTimeRef.current = now;
      lastActionTypeRef.current = char;
      onInputLetter(char);
      resetInputValue();
    },
    [onInputLetter, resetInputValue]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isRoundOver) return;

    // Handle navigation and editing keys
    switch (e.key) {
      case "Enter":
        e.preventDefault();
        onEnter?.();
        return;
      case "Backspace":
      case "Delete":
        e.preventDefault();
        lastActionTimeRef.current = Date.now();
        lastActionTypeRef.current = "BACKSPACE";
        onClearTile();
        resetInputValue();
        return;
      case "ArrowLeft":
        e.preventDefault();
        onNavigate("left");
        return;
      case "ArrowRight":
        e.preventDefault();
        onNavigate("right");
        return;
      case "ArrowUp":
        e.preventDefault();
        onNavigate("up");
        return;
      case "ArrowDown":
        e.preventDefault();
        onNavigate("down");
        return;
      case "Home":
        e.preventDefault();
        onNavigate("home");
        return;
      case "End":
        e.preventDefault();
        onNavigate("end");
        return;
    }

    // Direct single letter entry A-Z
    if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault();
      const char = e.key.toUpperCase();
      lastActionTimeRef.current = Date.now();
      lastActionTypeRef.current = char;
      onInputLetter(char);
      resetInputValue();
    }
  };

  // Modern input event handler for mobile virtual keyboards (Android Chrome / iOS Safari)
  const handleBeforeInput = (e: React.FormEvent<HTMLInputElement>) => {
    if (isRoundOver) return;

    const native = e.nativeEvent as InputEvent;
    const inputType = native.inputType;

    if (inputType && inputType.startsWith("delete")) {
      e.preventDefault();
      executeVirtualClear();
      return;
    }

    if (inputType && (inputType === "insertText" || inputType === "insertCompositionText")) {
      const data = native.data;
      if (data) {
        const char = data.slice(-1).toUpperCase();
        if (/^[A-Z]$/.test(char)) {
          e.preventDefault();
          executeVirtualInput(char);
          return;
        }
      }
    }
  };

  // Resilient fallback for virtual keyboards that do not prevent default on beforeinput
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isRoundOver) return;

    const val = e.target.value;

    // If the sentinel space was removed (or input is empty), it represents a deletion / Backspace
    if (val === "" || val.length === 0) {
      executeVirtualClear();
      return;
    }

    // Extract any newly entered alphabetical character
    const cleaned = val.replace(/\s/g, "");
    if (cleaned.length > 0) {
      const char = cleaned.slice(-1).toUpperCase();
      if (/^[A-Z]$/.test(char)) {
        executeVirtualInput(char);
        return;
      }
    }

    // Always restore sentinel space
    resetInputValue();
  };

  const handleTileClick = (pos: TilePosition) => {
    onSelectTile(pos);
    if (inputRef.current) {
      if (inputRef.current.value !== " ") {
        resetInputValue();
      }
      inputRef.current.focus({ preventScroll: true });
    }
  };

  return (
    <div
      className="relative flex flex-col items-center justify-center p-2 sm:p-4 outline-none select-none"
      data-testid="letter-grid"
      onClick={() => {
        if (!selectedPosition && !isRoundOver) {
          onNavigate("home");
        }
        if (inputRef.current) {
          if (inputRef.current.value !== " ") {
            resetInputValue();
          }
          inputRef.current.focus({ preventScroll: true });
        }
      }}
    >
      {/* Hidden text capture input for mobile virtual keyboard and physical keyboard parity */}
      <input
        ref={inputRef}
        type="text"
        inputMode="text"
        defaultValue=" "
        autoCapitalize="characters"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label="Letter input for active tile"
        disabled={isRoundOver}
        onKeyDown={handleKeyDown}
        onBeforeInput={handleBeforeInput}
        onChange={handleInputChange}
        className="absolute -top-10 left-0 h-1 w-1 opacity-0 pointer-events-none text-base"
        tabIndex={-1}
      />

      {/* Responsive Word Groups Container */}
      <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 md:gap-12">
        {grid.words.map((wordTiles, wordIndex) => (
          <div
            key={`word-${wordIndex}`}
            className="flex items-center gap-1.5 sm:gap-2"
            role="group"
            aria-label={`Word ${wordIndex + 1} (${wordTiles.length} letters)`}
            data-testid={`word-group-${wordIndex}`}
          >
            {wordTiles.map((tile) => {
              const isSelected =
                selectedPosition?.wordIndex === tile.wordIndex &&
                selectedPosition?.letterIndex === tile.letterIndex;

              return (
                <LetterTile
                  key={`tile-${tile.wordIndex}-${tile.letterIndex}`}
                  tile={tile}
                  isSelected={isSelected}
                  isRoundOver={isRoundOver}
                  onSelect={() =>
                    handleTileClick({ wordIndex: tile.wordIndex, letterIndex: tile.letterIndex })
                  }
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
