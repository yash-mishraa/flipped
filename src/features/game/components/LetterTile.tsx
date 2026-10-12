"use client";

import React from "react";
import { Check, Lock, Slash } from "lucide-react";
import type { LetterTile as TileModel } from "../domain/types";
import { cn } from "@/lib/utils";

export interface LetterTileProps {
  readonly tile: TileModel;
  readonly isSelected: boolean;
  readonly isRoundOver: boolean;
  readonly onSelect: () => void;
}

/**
 * LetterTile renders an individual character slot within an answer word.
 * Provides distinct multi-modal visual cues (colors, borders, icons, text styles)
 * to ensure accessibility across color vision deficiencies.
 */
export function LetterTile({
  tile,
  isSelected,
  isRoundOver,
  onSelect,
}: LetterTileProps): React.JSX.Element {
  const { letter, isFixed, feedback, wordIndex, letterIndex } = tile;

  // Build descriptive accessible label for screen readers
  const positionLabel = `Word ${wordIndex + 1}, Letter ${letterIndex + 1}`;
  let statusLabel = "Empty";
  if (isFixed) {
    statusLabel = `Fixed clue letter ${letter}`;
  } else if (letter) {
    statusLabel = `Letter ${letter}, ${feedback.toLowerCase()}`;
  }

  // Determine styling classes based on feedback and selection
  const feedbackClasses = React.useMemo(() => {
    if (isFixed) {
      return "bg-stone-100 border-stone-300 text-stone-900 font-extrabold shadow-sm";
    }

    switch (feedback) {
      case "CONFIRMED":
        return "bg-emerald-50/90 border-emerald-500 text-emerald-950 font-bold shadow-sm";
      case "ELIMINATED":
        return "bg-stone-100/60 border-stone-300/80 border-dashed text-stone-400 line-through decoration-stone-400";
      case "PENDING":
        return "bg-amber-50/80 border-amber-300 text-amber-950 font-semibold shadow-sm";
      case "NONE":
      default:
        return "bg-white border-stone-200/90 text-stone-900";
    }
  }, [isFixed, feedback]);

  const selectionClasses =
    isSelected && !isRoundOver
      ? "ring-2 ring-coral-500 ring-offset-2 border-coral-500 z-10 scale-[1.02]"
      : "hover:border-stone-300";

  return (
    <button
      type="button"
      role="button"
      disabled={isFixed || isRoundOver}
      onClick={onSelect}
      aria-label={`${positionLabel}: ${statusLabel}`}
      aria-pressed={isSelected}
      data-testid={`tile-${wordIndex}-${letterIndex}`}
      data-feedback={feedback}
      data-fixed={isFixed}
      data-selected={isSelected}
      className={cn(
        "relative flex h-14 w-11 sm:h-16 sm:w-13 md:h-18 md:w-15 items-center justify-center rounded-lg border-2 text-xl sm:text-2xl font-bold select-none transition-all duration-150 motion-reduce:transition-none motion-reduce:transform-none",
        feedbackClasses,
        selectionClasses,
        isFixed && "cursor-default opacity-95",
        !isFixed && !isRoundOver && "cursor-pointer active:scale-95"
      )}
    >
      {/* Letter glyph */}
      <span aria-hidden="true" className="tracking-wide">
        {letter}
      </span>

      {/* Non-color visual indicator badges */}
      {isFixed && (
        <span
          className="absolute top-1 right-1 text-stone-400"
          title="Fixed clue letter"
          aria-hidden="true"
        >
          <Lock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
        </span>
      )}

      {!isFixed && feedback === "CONFIRMED" && (
        <span
          className="absolute top-1 right-1 text-emerald-600"
          title="Confirmed in correct position"
          aria-hidden="true"
        >
          <Check className="h-3 w-3 stroke-[3]" />
        </span>
      )}

      {!isFixed && feedback === "ELIMINATED" && (
        <span
          className="absolute top-1 right-1 text-stone-400"
          title="Ruled out"
          aria-hidden="true"
        >
          <Slash className="h-2.5 w-2.5" />
        </span>
      )}

      {!isFixed && feedback === "PENDING" && (
        <span
          className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-amber-400"
          title="In puzzle, but in different position"
          aria-hidden="true"
        />
      )}
    </button>
  );
}
