"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface DurationOption {
  readonly seconds: number;
  readonly label: string;
  readonly description: string;
}

export const SPRINT_DURATION_OPTIONS: readonly DurationOption[] = [
  {
    seconds: 60,
    label: "1 Min",
    description: "Lightning sprint",
  },
  {
    seconds: 120,
    label: "2 Min",
    description: "Fast-paced rush",
  },
  {
    seconds: 180,
    label: "3 Min",
    description: "Standard gauntlet",
  },
  {
    seconds: 300,
    label: "5 Min",
    description: "Endurance marathon",
  },
];

export interface ClassicDurationSelectorProps {
  readonly selectedDuration: number; // in seconds
  readonly onSelectDuration: (seconds: number) => void;
  readonly disabled?: boolean;
}

export function ClassicDurationSelector({
  selectedDuration,
  onSelectDuration,
  disabled = false,
}: ClassicDurationSelectorProps): React.JSX.Element {
  const activeOption =
    SPRINT_DURATION_OPTIONS.find((opt) => opt.seconds === selectedDuration) ||
    SPRINT_DURATION_OPTIONS[2]!;

  return (
    <div className="space-y-2">
      <div
        role="radiogroup"
        aria-label="Select Sprint Duration"
        className="grid w-full grid-cols-4 gap-1.5 sm:gap-2.5"
      >
        {SPRINT_DURATION_OPTIONS.map((option) => {
          const isSelected = selectedDuration === option.seconds;

          return (
            <button
              key={option.seconds}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onSelectDuration(option.seconds)}
              className={cn(
                "flex flex-col items-center justify-center rounded-xl border py-2 px-1 sm:p-2.5 text-center transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B1E2B] cursor-pointer active:scale-[0.97]",
                isSelected
                  ? "border-[#7B1E2B] bg-[#7B1E2B] text-[#F7F0E5] shadow-xs font-bold"
                  : "border-[#C49A6C]/40 bg-white/85 text-[#32171D] hover:border-[#7B1E2B]/60 hover:bg-[#faeee0]/60",
                disabled && "opacity-50 cursor-not-allowed active:scale-100"
              )}
            >
              <span className="text-xs sm:text-sm font-extrabold">{option.label}</span>
              <span
                className={cn(
                  "mt-0.5 text-[9px] sm:text-[10px] truncate max-w-full",
                  isSelected ? "text-[#F7F0E5]/80" : "text-[#8C6D68]"
                )}
              >
                {option.description}
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-[#C49A6C]/30 bg-[#faeee0]/40 py-2 px-3 text-center text-xs text-[#6B4E55]">
        <span>
          <strong className="text-[#32171D]">{activeOption.label} Sprint:</strong> {activeOption.description} • Unlimited puzzles until 0:00
        </span>
      </div>
    </div>
  );
}
