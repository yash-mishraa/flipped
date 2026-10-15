"use client";

import React from "react";
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
    badgeClass: "bg-[#faeee0] text-[#32171D] border-[#C49A6C]",
  },
  {
    id: "MEDIUM",
    label: "Medium",
    description: "Moderately challenging word pairs requiring broader vocabulary deduction.",
    vocabulary: "Expanded lexicon • Nuanced meanings",
    badgeClass: "bg-[#faeee0] text-[#32171D] border-[#C49A6C]",
  },
  {
    id: "HARD",
    label: "Hard",
    description: "Less predictable phrase transformations with abstract semantic connections.",
    vocabulary: "Advanced vocabulary • Complex relationships",
    badgeClass: "bg-[#faeee0] text-[#7B1E2B] border-[#7B1E2B]",
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
  const activeOption =
    DIFFICULTY_OPTIONS.find((opt) => opt.id === selectedDifficulty) || DIFFICULTY_OPTIONS[1]!;

  return (
    <div className="space-y-2">
      {/* 3-Column Segmented Control */}
      <div
        role="radiogroup"
        aria-label="Select Classic Difficulty"
        className="grid w-full grid-cols-3 gap-2 sm:gap-2.5"
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
                "flex items-center justify-center gap-1.5 rounded-xl border py-2.5 px-2 text-center transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B1E2B] cursor-pointer active:scale-[0.97]",
                isSelected
                  ? "border-[#7B1E2B] bg-[#7B1E2B] text-[#F7F0E5] shadow-xs font-extrabold"
                  : "border-[#C49A6C]/50 bg-white/85 text-[#32171D] hover:border-[#7B1E2B]/60 hover:bg-[#faeee0]/60",
                disabled && "opacity-60 cursor-not-allowed active:scale-100"
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  isSelected ? "bg-[#F7F0E5]" : "border border-[#C49A6C] bg-transparent"
                )}
                aria-hidden="true"
              />
              <span className="text-xs sm:text-sm font-bold tracking-tight">{option.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Tier Explanation Card */}
      <div className="rounded-2xl border border-[#C49A6C]/40 bg-[#faeee0]/50 p-3 text-left shadow-2xs">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="font-extrabold text-[#7B1E2B] uppercase text-[11px] tracking-wider">
            {activeOption.label} Tier
          </span>
          <span className="text-[10px] font-semibold text-[#8C6870]">
            {activeOption.vocabulary}
          </span>
        </div>
        <p className="mt-1 text-xs text-[#6B4E55] leading-relaxed">
          {activeOption.description}
        </p>
      </div>
    </div>
  );
}
