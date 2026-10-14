"use client";

import React from "react";
import { Clock } from "lucide-react";
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
  return (
    <div
      role="radiogroup"
      aria-label="Select Sprint Duration"
      className="grid w-full grid-cols-2 gap-2.5 sm:grid-cols-4"
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
              "flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B1E2B] cursor-pointer",
              isSelected
                ? "border-[#7B1E2B] bg-[#7B1E2B] text-[#F7F0E5] shadow-sm font-bold"
                : "border-[#C49A6C]/40 bg-white/80 text-[#32171D] hover:border-[#7B1E2B] hover:bg-white",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="flex items-center gap-1.5">
              <Clock className={cn("h-3.5 w-3.5", isSelected ? "text-[#F7F0E5]" : "text-[#7B1E2B]")} />
              <span className="text-sm font-extrabold">{option.label}</span>
            </div>
            <span
              className={cn(
                "mt-0.5 text-[10px]",
                isSelected ? "text-[#F7F0E5]/80" : "text-[#8C6D68]"
              )}
            >
              {option.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
