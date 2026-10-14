"use client";

import React, { useState } from "react";

/**
 * GameInstructions renders a collapsible, screen-reader friendly guide
 * detailing the 4 transformation combinations, keyboard controls, and multi-modal feedback legend.
 */
export function GameInstructions(): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mx-auto w-full max-w-xl rounded-xl border border-[#C49A6C]/40 bg-white/70 p-4 shadow-xs backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="instructions-content"
        className="flex w-full items-center justify-between text-left text-xs font-semibold uppercase tracking-wider text-[#32171D] transition-all duration-200 ease-out hover:text-[#7B1E2B] active:opacity-75 cursor-pointer"
      >
        <span>How to Play & 4 Transformation Permutations</span>
        <span className="text-xs text-[#8C6870] font-bold" aria-hidden="true">
          {isOpen ? "Hide ▲" : "Show ▼"}
        </span>
      </button>

      {isOpen && (
        <div
          id="instructions-content"
          className="mt-3 space-y-3 border-t border-[#C49A6C]/20 pt-3 text-xs text-[#6B4E55]"
        >
          <p>
            <strong>Core Objective:</strong> Deduce the two-word target phrase from the two clue words. Clues do not reveal whether they are synonyms or antonyms. You must deduce which of the <strong>4 possible combinations</strong> connects the clues to the solution:
          </p>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-[#32171D]">
            <div className="rounded-lg border border-[#C49A6C]/30 bg-[#faeee0]/60 p-2 text-center">
              1. Synonym + Antonym
            </div>
            <div className="rounded-lg border border-[#C49A6C]/30 bg-[#faeee0]/60 p-2 text-center">
              2. Antonym + Synonym
            </div>
            <div className="rounded-lg border border-[#C49A6C]/30 bg-[#faeee0]/60 p-2 text-center">
              3. Synonym + Synonym
            </div>
            <div className="rounded-lg border border-[#C49A6C]/30 bg-[#faeee0]/60 p-2 text-center">
              4. Antonym + Antonym
            </div>
          </div>

          <p>
            <strong>Automatic Victory Detection:</strong> The first letter of each word is permanently locked as a fixed clue. Type letters into the remaining tiles. As soon as all the correct letters are entered, the game finishes automatically and your winning pop-up appears!
          </p>

          <div className="rounded-lg bg-[#faeee0]/50 p-2.5 border border-[#C49A6C]/30">
            <h4 className="font-bold text-[#32171D] uppercase tracking-wider text-[11px]">
              Tile Legend & Letter Feedback
            </h4>
            <ul className="mt-2 space-y-1.5 text-[11px]">
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded border border-[#C49A6C] bg-[#32171D] text-[#C49A6C] font-bold text-[10px]">
                  F
                </span>
                <span>
                  <strong>Fixed Clue:</strong> Permanently revealed first letter, cannot be edited.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded border border-[#C49A6C] bg-[#32171D] text-[#F7F0E5] font-bold text-[10px]">
                  C
                </span>
                <span>
                  <strong>Confirmed:</strong> Correct letter in the exact position.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded border border-dashed border-[#7B1E2B] bg-[#7B1E2B]/10 text-[#7B1E2B] font-bold text-[10px] line-through">
                  W
                </span>
                <span>
                  <strong>Wrong Letter:</strong> Marked with a dashed crimson border and strikethrough.
                </span>
              </li>
            </ul>
          </div>

          <p className="text-[11px] text-[#8C6870]">
            <strong>Controls:</strong> Type letters A-Z, Backspace/Delete to clear, and Arrow keys to navigate.
          </p>
        </div>
      )}
    </div>
  );
}
