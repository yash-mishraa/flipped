"use client";

import React, { useState } from "react";
import { Lightbulb } from "lucide-react";
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
        onClick={handleClick}
        disabled={isRoundOver || isProcessing}
        aria-label={`Use a hint. Cost is 5 points deduction. ${hintsUsed} used so far.`}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50/90 px-4 py-2 text-xs font-semibold text-amber-900 shadow-sm transition-all duration-150 select-none",
          "hover:bg-amber-100 hover:border-amber-300 active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2",
          (isRoundOver || isProcessing) && "cursor-not-allowed opacity-50"
        )}
      >
        <Lightbulb className="h-4 w-4 text-amber-600" aria-hidden="true" />
        <span>Use Hint</span>
        <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900">
          -5 pts
        </span>
        {hintsUsed > 0 && (
          <span className="text-[10px] font-medium text-amber-800">({hintsUsed} used)</span>
        )}
      </button>

      {feedbackNotice && (
        <p
          role="status"
          aria-live="polite"
          className="text-xs font-medium text-amber-800 transition-opacity"
        >
          {feedbackNotice}
        </p>
      )}
    </div>
  );
}
