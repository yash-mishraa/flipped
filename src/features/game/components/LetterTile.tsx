"use client";

import React from "react";
import { Check, Lock, Slash } from "lucide-react";
import type { LetterTile as TileModel } from "../domain/types";
import { cn } from "@/lib/utils";
import TechText from "@/components/TechText";

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
      return "bg-[#32171D] border-[#C49A6C] text-[#C49A6C] font-extrabold shadow-sm";
    }

    switch (feedback) {
      case "CONFIRMED":
        return "bg-[#32171D] border-[#C49A6C] text-[#F7F0E5] font-bold shadow-sm";
      case "ELIMINATED":
        return "bg-[#F7F0E5] border-[#C49A6C]/40 border-dashed text-[#8C6870] line-through decoration-[#8C6870]";
      case "PENDING":
        return "bg-[#faeee0] border-[#C49A6C] text-[#32171D] font-semibold shadow-sm";
      case "NONE":
      default:
        return "bg-[#F7F0E5] border-[#C49A6C] text-[#32171D]";
    }
  }, [isFixed, feedback]);

  const selectionClasses =
    isSelected && !isRoundOver
      ? "ring-2 ring-[#7B1E2B] ring-offset-2 border-[#7B1E2B] z-10 scale-[1.02]"
      : "hover:border-[#7B1E2B]/60";

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
      data-has-letter={Boolean(letter)}
      data-selected={isSelected}
      className={cn(
        "relative flex h-14 w-11 sm:h-16 sm:w-13 md:h-18 md:w-15 items-center justify-center rounded-lg border-2 text-xl sm:text-2xl font-bold select-none transition-all duration-150 motion-reduce:transition-none motion-reduce:transform-none",
        feedbackClasses,
        selectionClasses,
        isFixed && "cursor-default opacity-95",
        !isFixed && !isRoundOver && "cursor-pointer active:scale-95"
      )}
    >
      {/* Canvas glyph follows the controlled tile value exactly, including clears and hints. */}
      <span aria-hidden="true" className="tile-tech-glyph">
        <span className="sr-only">{letter}</span>
        <TechText
          text={letter || " "}
          fontFamily="Georgia, serif"
          fontWeight={700}
          fontSize={58}
          letterSpacing={0}
          color="currentColor"
          accentColor="currentColor"
          reveal="off"
          specks={0}
          selection={false}
          labels={false}
          draggable={false}
          sweep={false}
          className="tile-tech-text"
          style={{}}
          aria-hidden="true"
        />
      </span>

      {/* Non-color visual indicator badges */}
      {isFixed && (
        <span
          className="absolute top-1 right-1 text-[#C49A6C]"
          title="Fixed clue letter"
          aria-hidden="true"
        >
          <Lock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
        </span>
      )}

      {!isFixed && feedback === "CONFIRMED" && (
        <span
          className="absolute top-1 right-1 text-[#C49A6C]"
          title="Confirmed in correct position"
          aria-hidden="true"
        >
          <Check className="h-3 w-3 stroke-[3]" />
        </span>
      )}

      {!isFixed && feedback === "ELIMINATED" && (
        <span
          className="absolute top-1 right-1 text-[#8C6870]"
          title="Ruled out"
          aria-hidden="true"
        >
          <Slash className="h-2.5 w-2.5" />
        </span>
      )}

      {!isFixed && feedback === "PENDING" && (
        <span
          className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[#C49A6C]"
          title="In puzzle, but in different position"
          aria-hidden="true"
        />
      )}
    </button>
  );
}
