"use client";

import React from "react";
import { Play, Sparkles, Lightbulb, RotateCcw } from "lucide-react";
import type { Puzzle, RoundStatus } from "../domain/types";
import { GameTimer } from "./GameTimer";
import type { TimerUrgency } from "../domain/timer-utils";

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
}

/**
 * GameHUD provides the top navigation and status heads-up display:
 * - Round status indicator
 * - 60-second countdown timer
 * - Current potential score
 * - Hints used counter
 * - Prominent "Start Game" call to action when in READY state
 * - Transformation clue pair cards
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
}: GameHUDProps): React.JSX.Element {
  const isReady = roundStatus === "READY";
  const isRoundOver = roundStatus === "WON" || roundStatus === "TIMED_OUT";

  const getStatusBadge = () => {
    switch (roundStatus) {
      case "READY":
        return (
          <span className="rounded-full border border-[#C49A6C] bg-[#faeee0] px-2.5 py-0.5 text-xs font-semibold text-[#32171D]">
            Ready to Play
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
            <Sparkles className="h-3.5 w-3.5 text-[#7B1E2B]" aria-hidden="true" />
            <span>Score:</span>
            <strong className="text-[#32171D] font-bold">{score}</strong>
          </div>
          <span className="hidden sm:inline text-xs text-[#8C6870]">•</span>
          <div className="flex items-center gap-1 text-xs text-[#6B4E55]">
            <Lightbulb className="h-3.5 w-3.5 text-[#C49A6C]" aria-hidden="true" />
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
              className="inline-flex items-center gap-1 rounded-lg border border-[#C49A6C] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#32171D] shadow-sm transition hover:bg-[#faeee0] active:scale-95"
            >
              <RotateCcw className="h-3.5 w-3.5 text-[#7B1E2B]" aria-hidden="true" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Clues Transformation Surface */}
      <section
        className="flex w-full flex-col items-center gap-3 rounded-2xl border border-[#C49A6C]/60 bg-white/80 p-5 text-center shadow-sm backdrop-blur-sm"
        aria-label="Puzzle Clues"
      >
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#7B1E2B]">
          Transform the Clues
        </span>

        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          {puzzle.transformations.map((trans, idx) => (
            <div key={`hud-clue-${idx}`} className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#32171D]">
                {trans.clueWord}
              </span>
              <span className="mt-1 rounded-full border border-[#C49A6C]/40 bg-[#faeee0] px-2.5 py-0.5 text-xs font-semibold text-[#32171D]">
                {trans.relationship}
              </span>
            </div>
          ))}
        </div>

        {/* Start Game Prominent Call-to-Action in READY state */}
        {isReady && (
          <div className="mt-3 flex flex-col items-center gap-2 border-t border-[#C49A6C]/30 pt-4 w-full max-w-sm">
            <button
              type="button"
              onClick={onStartGame}
              data-testid="start-game-button"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#7B1E2B] px-6 py-3 text-base font-bold text-[#F7F0E5] shadow-md transition-all hover:bg-[#631722] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B1E2B] focus-visible:ring-offset-2"
            >
              <Play className="h-5 w-5 fill-[#F7F0E5]" aria-hidden="true" />
              <span>Start Game (60s)</span>
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
