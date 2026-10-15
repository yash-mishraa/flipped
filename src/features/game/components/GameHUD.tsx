"use client";

import React from "react";
import type { Puzzle, RoundStatus } from "../domain/types";
import { GameTimer } from "./GameTimer";
import type { TimerUrgency } from "../domain/timer-utils";
import { cn } from "@/lib/utils";

export interface GameHUDProps {
  readonly puzzle: Puzzle;
  readonly roundStatus: RoundStatus;
  readonly formattedTime: string;
  readonly urgency: TimerUrgency;
  readonly isRunning: boolean;
  readonly score: number;
  readonly hintsUsed: number;
  readonly onStartGame: () => void;
  readonly onRestart: () => void;
  readonly isMasked?: boolean;
  readonly hideStartButton?: boolean;
}

/**
 * GameHUD provides the top navigation and status heads-up display:
 * - Round status indicator
 * - 60-second countdown timer
 * - Current potential score
 * - Hints used counter
 * - Prominent "Start Game" call to action when in READY state
 * - Transformation clue pair cards (masked when isMasked is true)
 */
export function GameHUD({
  puzzle,
  roundStatus,
  formattedTime,
  urgency,
  isRunning,
  score,
  hintsUsed,
  onStartGame,
  onRestart,
  isMasked = false,
  hideStartButton = false,
}: GameHUDProps): React.JSX.Element {
  const isReady = roundStatus === "READY";
  const isRoundOver = roundStatus === "WON" || roundStatus === "TIMED_OUT";

  const getStatusBadge = () => {
    switch (roundStatus) {
      case "READY":
        return (
          <span className="rounded-full border border-[#C49A6C] bg-[#faeee0] px-2.5 py-0.5 text-xs font-semibold text-[#32171D]">
            {isMasked ? "Starting Soon" : "Ready to Play"}
          </span>
        );
      case "PLAYING":
        return (
          <span className="rounded-full bg-[#7B1E2B] px-2.5 py-0.5 text-xs font-semibold text-[#F7F0E5]">
            Round Active
          </span>
        );
      case "WON":
        return (
          <span className="rounded-full bg-[#C49A6C] px-2.5 py-0.5 text-xs font-bold text-[#32171D]">
            Solved
          </span>
        );
      case "TIMED_OUT":
        return (
          <span className="rounded-full bg-[#32171D] px-2.5 py-0.5 text-xs font-semibold text-[#F7F0E5]">
            Time Expired
          </span>
        );
    }
  };

  return (
    <div className="flex w-full flex-col gap-4" data-testid="game-hud">
      {/* Top Status & Metrics Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#C49A6C]/50 bg-white/70 p-3.5 shadow-sm backdrop-blur-sm sm:px-5">
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <span className="hidden sm:inline text-xs text-[#8C6870]">•</span>
          <div className="flex items-center gap-1 text-xs text-[#6B4E55]">
            <span>Score:</span>
            <strong className="text-[#32171D] font-bold">{score}</strong>
          </div>
          <span className="hidden sm:inline text-xs text-[#8C6870]">•</span>
          <div className="flex items-center gap-1 text-xs text-[#6B4E55]">
            <span>Hints:</span>
            <strong className="text-[#32171D] font-bold">{hintsUsed}</strong>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <GameTimer
            formattedTime={formattedTime}
            urgency={urgency}
            isRunning={isRunning}
            isRoundOver={isRoundOver}
          />

          {!isReady && !isRoundOver && (
            <button
              type="button"
              onClick={onRestart}
              title="Restart round from scratch"
              aria-label="Restart round"
              className="inline-flex items-center justify-center rounded-full border border-[#C49A6C] bg-white px-3.5 py-1 text-xs font-semibold text-[#32171D] shadow-xs transition-all duration-200 ease-out hover:bg-[#faeee0] active:scale-[0.96] cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Clues Transformation Surface */}
      <section
        className="flex w-full flex-col items-center gap-3 rounded-2xl border border-[#C49A6C]/60 bg-white/80 p-4 sm:p-5 text-center shadow-sm backdrop-blur-sm"
        aria-label="Puzzle Clues"
      >
        <div className="flex w-full items-center justify-between px-1">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#7B1E2B]">
            Transform the Clues
          </span>

          {/* Mobile In-Card Live Timer — visible directly above grid when actively playing on mobile */}
          {isRunning && (
            <div
              data-testid="hud-card-mobile-timer"
              className={cn(
                "sm:hidden inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-black tabular-nums font-mono shadow-2xs transition-colors duration-200",
                urgency === "critical"
                  ? "border-[#7B1E2B] bg-[#faeee0] text-[#7B1E2B] animate-pulse"
                  : urgency === "urgent"
                    ? "border-[#C49A6C] bg-[#fbf5ec] text-[#32171D]"
                    : "border-[#C49A6C]/60 bg-[#faeee0] text-[#32171D]"
              )}
              aria-label={`Time remaining: ${formattedTime}`}
            >
              <span className="font-mono text-xs font-black tracking-wider">
                Timer: {formattedTime}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          {puzzle.transformations.map((trans, idx) => (
            <div key={`hud-clue-${idx}`} className="flex items-center gap-4 sm:gap-6">
              {isMasked ? (
                <span
                  data-testid={`masked-clue-${idx}`}
                  aria-label="Clue hidden until countdown ends"
                  className="inline-flex items-center justify-center rounded-2xl border border-[#C49A6C]/40 bg-[#faeee0]/60 px-6 py-2.5 text-2xl sm:text-3xl font-extrabold tracking-widest text-[#8C6870]/60 shadow-xs select-none"
                >
                  ••••••
                </span>
              ) : (
                <span className="rounded-2xl border border-[#C49A6C]/50 bg-[#faeee0] px-5 py-2.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#32171D] shadow-xs">
                  {trans.clueWord}
                </span>
              )}
              {idx < puzzle.transformations.length - 1 && (
                <span className="text-2xl font-black text-[#C49A6C]" aria-hidden="true">
                  +
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Start Game Prominent Call-to-Action in READY state (hidden when hideStartButton or isMasked) */}
        {isReady && !hideStartButton && !isMasked && (
          <div className="mt-3 flex flex-col items-center gap-2 border-t border-[#C49A6C]/30 pt-4 w-full max-w-sm">
            <button
              type="button"
              onClick={onStartGame}
              data-testid="start-game-button"
              className="inline-flex w-full items-center justify-center rounded-full bg-[#7B1E2B] px-6 py-3 text-base font-bold text-[#F7F0E5] shadow-md transition-all duration-200 ease-out hover:bg-[#631722] hover:shadow-lg active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B1E2B] focus-visible:ring-offset-2 cursor-pointer"
            >
              Start Game (60s)
            </button>
            <p className="text-xs text-[#6B4E55]">
              You have 60 seconds. Editable tiles unlock immediately upon starting.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
