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

  // Keep hidden input focused when an editable tile is selected and round is active
  useEffect(() => {
    if (selectedPosition && !isRoundOver) {
      inputRef.current?.focus();
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
        e.preventDefault();
        onClearTile();
        return;
      case "Delete":
        e.preventDefault();
        onClearTile();
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
      onInputLetter(e.key.toUpperCase());
    }
  };

  // Fallback for mobile virtual keyboards that emit character inputs via input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isRoundOver) return;

    const val = e.target.value;
    if (val) {
      const char = val.slice(-1).toUpperCase();
      if (/^[A-Z]$/.test(char)) {
        onInputLetter(char);
      }
    }
    // Always keep the capture input clear
    e.target.value = "";
  };

  const handleTileClick = (pos: TilePosition) => {
    onSelectTile(pos);
    inputRef.current?.focus();
  };

  return (
    <div
      className="relative flex flex-col items-center justify-center p-2 sm:p-4 outline-none select-none"
      data-testid="letter-grid"
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
        className="absolute h-0 w-0 opacity-0 pointer-events-none text-base"
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
