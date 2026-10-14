"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export interface HintControlProps {
  readonly hintsUsed: number;
  readonly isRoundOver: boolean;
  readonly onUseHint: () =>
    { success: boolean; message: string } | Promise<{ success: boolean; message: string }>;
}

/**
 * HintControl allows players to reveal the next unrevealed answer letter
 * at the cost of a 5-point deduction calculated by the scoring engine.
 */
export function HintControl({
  hintsUsed,
  isRoundOver,
  onUseHint,
}: HintControlProps): React.JSX.Element {
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleClick = async () => {
    if (isProcessing || isRoundOver) return;
    setIsProcessing(true);
    try {
      const res = await onUseHint();
      setFeedbackNotice(res.message);

      // Auto-dismiss transient notice after 3 seconds
      setTimeout(() => {
        setFeedbackNotice(null);
      }, 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        data-testid="use-hint-button"
        onClick={handleClick}
        disabled={isRoundOver || isProcessing}
        aria-label={`Use a hint. Cost is 5 points deduction. ${hintsUsed} used so far.`}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-[#C49A6C] bg-[#faeee0] px-4 py-2 text-xs font-semibold text-[#32171D] shadow-sm transition-all duration-200 ease-out select-none cursor-pointer",
          "hover:bg-[#f4ddc5] hover:border-[#C49A6C] hover:shadow-xs active:scale-[0.97]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B1E2B] focus-visible:ring-offset-2",
          (isRoundOver || isProcessing) && "cursor-not-allowed opacity-50 active:scale-100"
        )}
      >
        <span>Use Hint</span>
        <span className="rounded-full bg-[#C49A6C] px-2 py-0.5 text-[10px] font-bold text-[#32171D]">
          -5 pts
        </span>
        {hintsUsed > 0 && (
          <span className="text-[10px] font-medium text-[#6B4E55]">({hintsUsed} used)</span>
        )}
      </button>

      {feedbackNotice && (
        <p
          role="status"
          aria-live="polite"
          className="text-xs font-medium text-[#7B1E2B] transition-opacity"
        >
          {feedbackNotice}
        </p>
      )}
    </div>
  );
}
