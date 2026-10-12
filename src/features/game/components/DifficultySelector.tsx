"use client";

import React from "react";
import { Check, Sparkles, Zap, Flame } from "lucide-react";
import type { Difficulty } from "../domain/types";
import { cn } from "@/lib/utils";

export interface DifficultyOption {
  readonly id: Difficulty;
  readonly label: string;
  readonly description: string;
  readonly vocabulary: string;
  readonly badgeClass: string;
}

export const DIFFICULTY_OPTIONS: readonly DifficultyOption[] = [
  {
    id: "EASY",
    label: "Easy",
    description: "Familiar everyday vocabulary with intuitive synonym and antonym pairings.",
    vocabulary: "Common phrases • Direct relationships",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  {
    id: "MEDIUM",
    label: "Medium",
    description: "Moderately challenging word pairs requiring broader vocabulary deduction.",
    vocabulary: "Expanded lexicon • Nuanced meanings",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
  },
  {
    id: "HARD",
    label: "Hard",
    description: "Less predictable phrase transformations with abstract semantic connections.",
    vocabulary: "Advanced vocabulary • Complex relationships",
    badgeClass: "bg-coral-100 text-coral-800 border-coral-200",
  },
];

export interface DifficultySelectorProps {
  readonly selectedDifficulty: Difficulty;
  readonly onSelectDifficulty: (difficulty: Difficulty) => void;
  readonly disabled?: boolean;
}

/**
 * DifficultySelector allows players to choose their challenge tier in Classic mode.
 */
export function DifficultySelector({
  selectedDifficulty,
  onSelectDifficulty,
  disabled = false,
}: DifficultySelectorProps): React.JSX.Element {
  const getIcon = (difficulty: Difficulty) => {
    switch (difficulty) {
      case "EASY":
        return <Sparkles className="h-4 w-4 text-emerald-600" aria-hidden="true" />;
      case "MEDIUM":
        return <Zap className="h-4 w-4 text-amber-600" aria-hidden="true" />;
      case "HARD":
        return <Flame className="h-4 w-4 text-coral-600" aria-hidden="true" />;
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label="Select Classic Difficulty"
      className="grid w-full grid-cols-1 gap-3.5 sm:grid-cols-3"
    >
      {DIFFICULTY_OPTIONS.map((option) => {
        const isSelected = selectedDifficulty === option.id;

        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onSelectDifficulty(option.id)}
            data-testid={`difficulty-${option.id.toLowerCase()}`}
            className={cn(
              "flex flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-500 focus-visible:ring-offset-2",
              isSelected
                ? "border-coral-500 bg-white shadow-md ring-1 ring-coral-500"
                : "border-stone-200/90 bg-white/70 hover:border-stone-300 hover:bg-white",
              disabled && "opacity-60 cursor-not-allowed"
            )}
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100">
                    {getIcon(option.id)}
                  </div>
                  <span className="font-bold text-stone-900 text-base">{option.label}</span>
                </div>

                <div
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border transition-colors",
                    isSelected ? "border-coral-500 bg-coral-500 text-white" : "border-stone-300"
                  )}
                >
                  {isSelected && <Check className="h-3 w-3 stroke-[3]" aria-hidden="true" />}
                </div>
              </div>

              <p className="mt-2.5 text-xs leading-relaxed text-stone-600">{option.description}</p>
            </div>

            <div className="mt-3.5 border-t border-stone-100 pt-2.5">
              <span className="text-[11px] font-semibold text-stone-500">{option.vocabulary}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
