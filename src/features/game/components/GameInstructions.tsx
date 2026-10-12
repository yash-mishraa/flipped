"use client";

import React, { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp, Lock, Check, Slash } from "lucide-react";

/**
 * GameInstructions renders a collapsible, screen-reader friendly guide
 * detailing the transformation rules, keyboard controls, and multi-modal feedback legend.
 */
export function GameInstructions(): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mx-auto w-full max-w-xl rounded-xl border border-stone-200/90 bg-white/60 p-4 shadow-sm backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="instructions-content"
        className="flex w-full items-center justify-between text-left text-xs font-semibold uppercase tracking-wider text-stone-600 transition-colors hover:text-stone-900"
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-coral-500" aria-hidden="true" />
          <span>How to Play & Feedback Guide</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-stone-400" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4 text-stone-400" aria-hidden="true" />
        )}
      </button>

      {isOpen && (
        <div
          id="instructions-content"
          className="mt-3 space-y-3 border-t border-stone-100 pt-3 text-xs text-stone-600"
        >
          <p>
            <strong>Core Objective:</strong> Deduce the two-word target phrase. Each clue word
            undergoes an explicit transformation (a <em>Synonym</em> or <em>Antonym</em>) to form
            the corresponding answer word.
          </p>

          <p>
            <strong>Automatic Detection:</strong> The first letter of each word is revealed. Enter
            letters into the remaining slots. When the full phrase matches, the puzzle solves
            instantly without any Submit button.
          </p>

          <div className="rounded-lg bg-stone-50 p-2.5">
            <h4 className="font-bold text-stone-800 uppercase tracking-wider text-[11px]">
              Tile Legend
            </h4>
            <ul className="mt-2 space-y-1.5">
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded border border-stone-300 bg-stone-100 text-stone-700">
                  <Lock className="h-3 w-3" />
                </span>
                <span>
                  <strong>Fixed Clue:</strong> Permanently revealed, cannot be edited.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded border border-emerald-500 bg-emerald-50 text-emerald-700">
                  <Check className="h-3 w-3" />
                </span>
                <span>
                  <strong>Confirmed:</strong> Correct letter in the exact correct position.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded border border-amber-300 bg-amber-50">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                </span>
                <span>
                  <strong>Pending:</strong> Letter exists in word, but in a different position.
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded border border-dashed border-stone-300 bg-stone-100 text-stone-400">
                  <Slash className="h-3 w-3" />
                </span>
                <span>
                  <strong>Eliminated:</strong> Letter does not belong in this word.
                </span>
              </li>
            </ul>
          </div>

          <p className="text-[11px] text-stone-500">
            <strong>Controls:</strong> Type letters A-Z, Backspace/Delete to clear, and Arrow keys
            to navigate.
          </p>
        </div>
      )}
    </div>
  );
}
