"use client";

import React from "react";
import { Clock, AlertTriangle, AlertCircle } from "lucide-react";
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
        return "border-coral-500 bg-coral-50 text-coral-600 shadow-coral-100 motion-safe:animate-pulse";
      case "urgent":
        return "border-amber-400 bg-amber-50 text-amber-800 shadow-amber-50";
      case "expired":
        return "border-stone-300 bg-stone-100 text-stone-500";
      case "normal":
      default:
        return isRunning
          ? "border-stone-300 bg-white text-stone-900 shadow-sm"
          : "border-stone-200 bg-stone-50 text-stone-600";
    }
  };

  const renderIcon = () => {
    switch (urgency) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-coral-600 shrink-0" aria-hidden="true" />;
      case "urgent":
        return <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" aria-hidden="true" />;
      case "expired":
      case "normal":
      default:
        return <Clock className="h-4 w-4 text-stone-500 shrink-0" aria-hidden="true" />;
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
        "inline-flex items-center gap-2 rounded-xl border px-3.5 py-1.5 transition-colors duration-200",
        getUrgencyStyles()
      )}
    >
      {renderIcon()}
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
