"use client";

import React, { useEffect, useRef } from "react";
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
  const lastKeyDownTimeRef = useRef<number>(0);
  const lastKeyDownCharRef = useRef<string>("");

  // Keep hidden input focused when an editable tile is selected and round is active
  useEffect(() => {
    if (selectedPosition && !isRoundOver) {
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [selectedPosition, isRoundOver]);

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
        lastKeyDownTimeRef.current = Date.now();
        lastKeyDownCharRef.current = "BACKSPACE";
        onClearTile();
        if (inputRef.current) inputRef.current.value = "";
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
      lastKeyDownTimeRef.current = Date.now();
      lastKeyDownCharRef.current = char;
      onInputLetter(char);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  // Fallback for mobile virtual keyboards that emit character inputs via input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isRoundOver) return;

    const val = e.target.value;
    const now = Date.now();

    if (val) {
      const char = val.slice(-1).toUpperCase();
      if (/^[A-Z]$/.test(char)) {
        // Drop if this exact character was ALREADY handled by onKeyDown less than 80ms ago
        if (char === lastKeyDownCharRef.current && now - lastKeyDownTimeRef.current < 80) {
          e.target.value = "";
          return;
        }
        lastKeyDownTimeRef.current = now;
        lastKeyDownCharRef.current = char;
        onInputLetter(char);
      }
    } else {
      // Empty string on input change may represent a virtual backspace
      if (lastKeyDownCharRef.current === "BACKSPACE" && now - lastKeyDownTimeRef.current < 80) {
        return;
      }
      lastKeyDownTimeRef.current = now;
      lastKeyDownCharRef.current = "BACKSPACE";
      onClearTile();
    }

    // Always keep the capture input clear
    e.target.value = "";
  };

  const handleTileClick = (pos: TilePosition) => {
    onSelectTile(pos);
    inputRef.current?.focus({ preventScroll: true });
  };

  return (
    <div
      className="relative flex flex-col items-center justify-center p-2 sm:p-4 outline-none select-none"
      data-testid="letter-grid"
      onClick={() => {
        if (!selectedPosition && !isRoundOver) {
          onNavigate("home");
        }
        inputRef.current?.focus({ preventScroll: true });
      }}
    >
      {/* Hidden text capture input for mobile virtual keyboard and physical keyboard parity */}
      <input
        ref={inputRef}
        type="text"
        inputMode="text"
        autoCapitalize="characters"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label="Letter input for active tile"
        disabled={isRoundOver}
        onKeyDown={handleKeyDown}
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
