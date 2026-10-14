"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Lightbulb,
  BookOpen,
  RotateCcw,
} from "lucide-react";
import { setOnboardingCompleted } from "../persistence/local-progress";

export interface TutorialModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function TutorialModal({ isOpen, onClose }: TutorialModalProps): React.JSX.Element | null {
  const [step, setStep] = useState<number>(1);
  const [practiceWord0, setPracticeWord0] = useState<string[]>(["F", "", "", ""]);
  const [practiceWord1, setPracticeWord1] = useState<string[]>(["F", "", "", ""]);
  const [selectedSlot, setSelectedSlot] = useState<{ wordIndex: number; letterIndex: number }>({
    wordIndex: 0,
    letterIndex: 1,
  });
  const [isPracticeSolved, setIsPracticeSolved] = useState<boolean>(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  // Focus trap & save prior focus
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
    } else {
      previouslyFocusedElement.current?.focus?.();
    }
  }, [isOpen]);

  const handleSkip = useCallback(() => {
    setOnboardingCompleted(true);
    onClose();
  }, [onClose]);

  const handleComplete = handleSkip;

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        handleSkip();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleSkip]);

  // Check practice answer auto-detection
  useEffect(() => {
    const w0 = practiceWord0.join("");
    const w1 = practiceWord1.join("");
    if (w0 === "FAST" && w1 === "FOOD") {
      setIsPracticeSolved(true);
    } else {
      setIsPracticeSolved(false);
    }
  }, [practiceWord0, practiceWord1]);

  const handlePracticeInput = useCallback(
    (char: string) => {
      const clean = char.toUpperCase().slice(0, 1);
      if (!clean) return;

      const { wordIndex, letterIndex } = selectedSlot;
      if (letterIndex === 0) return; // Slot 0 is fixed "F"

      if (wordIndex === 0) {
        const next = [...practiceWord0];
        next[letterIndex] = clean;
        setPracticeWord0(next);
        if (letterIndex < 3) {
          setSelectedSlot({ wordIndex: 0, letterIndex: letterIndex + 1 });
        } else {
          setSelectedSlot({ wordIndex: 1, letterIndex: 1 });
        }
      } else {
        const next = [...practiceWord1];
        next[letterIndex] = clean;
        setPracticeWord1(next);
        if (letterIndex < 3) {
          setSelectedSlot({ wordIndex: 1, letterIndex: letterIndex + 1 });
        }
      }
    },
    [selectedSlot, practiceWord0, practiceWord1]
  );

  const handlePracticeBackspace = useCallback(() => {
    const { wordIndex, letterIndex } = selectedSlot;
    if (wordIndex === 0) {
      if (practiceWord0[letterIndex]) {
        const next = [...practiceWord0];
        next[letterIndex] = "";
        setPracticeWord0(next);
      } else if (letterIndex > 1) {
        const prev = letterIndex - 1;
        const next = [...practiceWord0];
        next[prev] = "";
        setPracticeWord0(next);
        setSelectedSlot({ wordIndex: 0, letterIndex: prev });
      }
    } else {
      if (practiceWord1[letterIndex]) {
        const next = [...practiceWord1];
        next[letterIndex] = "";
        setPracticeWord1(next);
      } else if (letterIndex > 1) {
        const prev = letterIndex - 1;
        const next = [...practiceWord1];
        next[prev] = "";
        setPracticeWord1(next);
        setSelectedSlot({ wordIndex: 1, letterIndex: prev });
      } else {
        setSelectedSlot({ wordIndex: 0, letterIndex: 3 });
      }
    }
  }, [selectedSlot, practiceWord0, practiceWord1]);

  const resetPractice = () => {
    setPracticeWord0(["F", "", "", ""]);
    setPracticeWord1(["F", "", "", ""]);
    setSelectedSlot({ wordIndex: 0, letterIndex: 1 });
    setIsPracticeSolved(false);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative w-full max-w-xl rounded-3xl border border-[#C49A6C] bg-[#F7F0E5] p-6 sm:p-8 shadow-2xl focus:outline-none"
      >
        {/* Header with Close */}
        <div className="flex items-center justify-between border-b border-[#C49A6C]/50 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#faeee0] text-[#7B1E2B]">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
            </div>
            <h2 id="tutorial-dialog-title" className="text-lg font-bold text-[#32171D]">
              How to Play Flipped
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#8C6870]">Step {step} of 3</span>
            <button
              type="button"
              onClick={handleSkip}
              aria-label="Close tutorial dialog"
              className="rounded-lg p-1 text-[#8C6870] hover:bg-[#faeee0] hover:text-[#32171D] transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Step Content */}
        <div className="py-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#C49A6C]/80 bg-[#faeee0] p-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#7B1E2B]">
                  The Core Goal
                </span>
                <p className="mt-1 text-sm text-[#32171D] leading-relaxed">
                  You are given <strong>two clue words</strong>. Each word undergoes a semantic
                  shift to uncover a well-known two-word phrase!
                </p>
              </div>

              <div className="rounded-2xl border border-[#C49A6C]/60 bg-white p-5 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8C6870]">
                  Example Transformation
                </span>
                <div className="mt-3 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between rounded-xl border border-[#C49A6C]/30 bg-[#faeee0] p-3">
                    <span className="font-extrabold text-[#32171D]">SLOW</span>
                    <span className="text-xs font-bold text-[#7B1E2B] bg-white px-2 py-0.5 rounded border border-[#C49A6C]/30">
                      ANTONYM (Opposite)
                    </span>
                    <span className="font-extrabold text-[#7B1E2B]">FAST</span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-[#C49A6C]/30 bg-[#faeee0] p-3">
                    <span className="font-extrabold text-[#32171D]">MEAL</span>
                    <span className="text-xs font-bold text-[#6B4E55] bg-white px-2 py-0.5 rounded border border-[#C49A6C]/30">
                      SYNONYM (Similar)
                    </span>
                    <span className="font-extrabold text-[#7B1E2B]">FOOD</span>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-xs font-semibold text-[#6B4E55]">
                    Combined target phrase:{" "}
                    <strong className="text-[#32171D] text-sm">FAST FOOD</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#7B1E2B]">
                  Interactive Letter Grid
                </span>
                <p className="mt-1 text-sm text-[#32171D]">
                  The <strong>first letter of each word is revealed</strong>. Fill the empty slots.
                  Answers are <strong>accepted automatically</strong> the moment all letters are
                  correct!
                </p>
              </div>

              {/* Practice Grid */}
              <div
                className="rounded-2xl border border-[#C49A6C]/60 bg-white p-5 text-center shadow-xs"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Backspace") {
                    e.preventDefault();
                    handlePracticeBackspace();
                  } else if (/^[a-zA-Z]$/.test(e.key)) {
                    e.preventDefault();
                    handlePracticeInput(e.key);
                  }
                }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#6B4E55] uppercase">
                    Try it: Type &quot;FAST FOOD&quot;
                  </span>
                  <button
                    type="button"
                    onClick={resetPractice}
                    className="inline-flex items-center gap-1 text-xs text-[#8C6870] hover:text-[#32171D]"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset</span>
                  </button>
                </div>

                <div className="flex justify-center gap-4 my-3">
                  {/* Word 0 */}
                  <div className="flex gap-1.5">
                    {practiceWord0.map((letter, i) => {
                      const isFixed = i === 0;
                      const isSelected =
                        selectedSlot.wordIndex === 0 && selectedSlot.letterIndex === i;
                      return (
                        <button
                          key={`w0-${i}`}
                          type="button"
                          disabled={isFixed}
                          onClick={() => setSelectedSlot({ wordIndex: 0, letterIndex: i })}
                          className={`flex h-11 w-10 items-center justify-center rounded-xl border text-base font-extrabold transition ${
                            isFixed
                              ? "border-[#C49A6C] bg-[#32171D] text-[#C49A6C] cursor-default"
                              : isSelected
                                ? "border-[#7B1E2B] bg-white ring-2 ring-[#7B1E2B] text-[#32171D]"
                                : "border-[#C49A6C] bg-white text-[#32171D] hover:border-[#7B1E2B]"
                          }`}
                        >
                          {letter}
                        </button>
                      );
                    })}
                  </div>

                  {/* Word 1 */}
                  <div className="flex gap-1.5">
                    {practiceWord1.map((letter, i) => {
                      const isFixed = i === 0;
                      const isSelected =
                        selectedSlot.wordIndex === 1 && selectedSlot.letterIndex === i;
                      return (
                        <button
                          key={`w1-${i}`}
                          type="button"
                          disabled={isFixed}
                          onClick={() => setSelectedSlot({ wordIndex: 1, letterIndex: i })}
                          className={`flex h-11 w-10 items-center justify-center rounded-xl border text-base font-extrabold transition ${
                            isFixed
                              ? "border-[#C49A6C] bg-[#32171D] text-[#C49A6C] cursor-default"
                              : isSelected
                                ? "border-[#7B1E2B] bg-white ring-2 ring-[#7B1E2B] text-[#32171D]"
                                : "border-[#C49A6C] bg-white text-[#32171D] hover:border-[#7B1E2B]"
                          }`}
                        >
                          {letter}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile Virtual Helper Buttons */}
                <div className="mt-2 flex justify-center gap-1.5 flex-wrap">
                  {["A", "S", "T", "O", "D"].map((char) => (
                    <button
                      key={char}
                      type="button"
                      onClick={() => handlePracticeInput(char)}
                      className="h-8 w-8 rounded-lg border border-[#C49A6C] bg-[#faeee0] font-bold text-xs text-[#32171D] hover:bg-[#f4ddc5] active:scale-95"
                    >
                      {char}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handlePracticeBackspace}
                    className="px-2 h-8 rounded-lg border border-[#C49A6C] bg-[#faeee0] font-bold text-xs text-[#32171D] hover:bg-[#f4ddc5] active:scale-95"
                  >
                    ⌫
                  </button>
                </div>

                {isPracticeSolved && (
                  <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-bold text-[#32171D] bg-[#faeee0] py-2 rounded-xl border border-[#C49A6C]">
                    <CheckCircle2 className="h-4 w-4 text-[#7B1E2B]" />
                    <span>Auto-Detected! FAST FOOD is correct.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#C49A6C]/60 bg-white p-5 space-y-4 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#faeee0] text-[#C49A6C]">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#32171D] text-sm">60-Second Countdown</h4>
                    <p className="mt-0.5 text-xs text-[#6B4E55] leading-relaxed">
                      You have exactly 60 seconds per round. The score starts at 100 and decreases
                      by 1 point every 5 seconds.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-[#C49A6C]/20 pt-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#faeee0] text-[#7B1E2B]">
                    <Lightbulb className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#32171D] text-sm">
                      Strategic Hints (-5 Points)
                    </h4>
                    <p className="mt-0.5 text-xs text-[#6B4E55] leading-relaxed">
                      Need a nudge? Use a hint to reveal the next letter in reading order. Each hint
                      deducts 5 points from your final score.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-[#C49A6C]/20 pt-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#faeee0] text-[#C49A6C]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#32171D] text-sm">Two Ways to Play</h4>
                    <p className="mt-0.5 text-xs text-[#6B4E55] leading-relaxed">
                      <strong>Daily:</strong> One official challenge per day synchronized worldwide.
                      <br />
                      <strong>Classic:</strong> Unlimited practice across Easy, Medium, and Hard
                      difficulty tiers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between border-t border-[#C49A6C]/50 pt-4">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#C49A6C] px-4 py-2 text-xs font-semibold text-[#32171D] hover:bg-[#faeee0] transition active:scale-95"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSkip}
              className="text-xs font-semibold text-[#8C6870] hover:text-[#32171D] transition"
            >
              Skip Tutorial
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#7B1E2B] px-5 py-2.5 text-xs font-bold text-[#F7F0E5] shadow-sm hover:bg-[#631722] transition active:scale-95"
            >
              <span>Next</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleComplete}
              data-testid="start-playing-button"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#7B1E2B] px-6 py-2.5 text-xs font-bold text-[#F7F0E5] shadow-md hover:bg-[#631722] transition active:scale-95"
            >
              <span>Start Playing!</span>
              <Sparkles className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
