"use client";

import React from "react";
import type { TimerUrgency } from "../domain/timer-utils";
import { cn } from "@/lib/utils";

export interface GameTimerProps {
  readonly formattedTime: string;
  readonly urgency: TimerUrgency;
  readonly isRunning: boolean;
  readonly isRoundOver: boolean;
}

/**
 * GameTimer renders the countdown timer with multi-stage visual urgency:
 * - Normal (> 20s): Off-white/slate neutral badge.
 * - Urgent (11-20s): Warm amber alert styling.
 * - Critical (1-10s): Coral warning with subtle pulse (respects prefers-reduced-motion).
 * - Expired (0s): Muted stone styling.
 */
export function GameTimer({
  formattedTime,
  urgency,
  isRunning,
  isRoundOver,
}: GameTimerProps): React.JSX.Element {
  const getUrgencyStyles = () => {
    switch (urgency) {
      case "critical":
        return "border-[#7B1E2B] bg-[#faeee0] text-[#7B1E2B] motion-safe:animate-pulse";
      case "urgent":
        return "border-[#C49A6C] bg-[#fbf5ec] text-[#32171D]";
      case "expired":
        return "border-[#C49A6C]/50 bg-[#F7F0E5] text-[#8C6870]";
      case "normal":
      default:
        return isRunning
          ? "border-[#C49A6C] bg-white text-[#32171D] shadow-sm"
          : "border-[#C49A6C]/40 bg-[#F7F0E5] text-[#6B4E55]";
    }
  };

  return (
    <div
      role="timer"
      aria-label={`Time remaining: ${formattedTime}`}
      aria-live={urgency === "critical" || urgency === "expired" ? "assertive" : "off"}
      data-testid="game-timer"
      data-urgency={urgency}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 transition-colors duration-200",
        getUrgencyStyles()
      )}
    >
      <span className="font-mono text-lg sm:text-xl font-black tracking-widest tabular-nums">
        {formattedTime}
      </span>
      {isRoundOver && (
        <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
          Stopped
        </span>
      )}
    </div>
  );
}
