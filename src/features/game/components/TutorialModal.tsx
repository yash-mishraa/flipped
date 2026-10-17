"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { setOnboardingCompleted } from "../persistence/local-progress";

export interface TutorialModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function TutorialModal({ isOpen, onClose }: TutorialModalProps): React.JSX.Element | null {
  const [mounted, setMounted] = useState<boolean>(false);
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

  useEffect(() => {
    setMounted(true);
  }, []);

  // Focus trap & save prior focus
  useEffect(() => {
    if (isOpen && mounted) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
    } else if (previouslyFocusedElement.current) {
      previouslyFocusedElement.current.focus?.();
    }
  }, [isOpen, mounted]);

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

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-dialog-title"
      className="fixed inset-0 z-[100] flex min-h-[100dvh] w-screen items-center justify-center p-4 sm:p-6 overflow-y-auto bg-[#32171D]/50 backdrop-blur-sm animate-fade-in"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative my-auto w-full max-w-[92vw] sm:max-w-lg max-h-[90dvh] overflow-y-auto rounded-3xl border border-[#C49A6C] bg-[#F7F0E5] p-5 sm:p-7 shadow-2xl focus:outline-none"
      >
        {/* Header with Close */}
        <div className="flex items-center justify-between border-b border-[#C49A6C]/40 pb-3">
          <div>
            <h2 id="tutorial-dialog-title" className="text-lg font-bold text-[#32171D]">
              How Flipped Works
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#8C6870]">Step {step} of 3</span>
            <button
              type="button"
              onClick={handleSkip}
              aria-label="Close tutorial dialog"
              className="rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold text-[#8C6870] hover:bg-[#faeee0] hover:text-[#32171D] transition-all duration-200 ease-out active:scale-[0.92] cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Step Content */}
        <div className="py-5">
          {step === 1 && (
            <div className="space-y-4">
              <div className="border-l-2 border-[#7B1E2B] pl-3.5 py-1">
                <span className="text-xs font-black uppercase tracking-wider text-[#7B1E2B] block font-serif">
                  The Core Goal
                </span>
                <p className="mt-1 text-sm text-[#32171D] leading-relaxed font-serif">
                  You are given <strong>two clue words</strong>. Each word undergoes a semantic
                  shift to uncover a well-known two-word phrase!
                </p>
              </div>

              <div className="border-t border-[#C49A6C]/30 pt-4">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8C6870] block">
                  Example Transformation
                </span>
                <div className="mt-3 space-y-3">
                  <div className="border-l-2 border-[#C49A6C]/40 pl-3.5 py-1">
                    <div className="flex flex-wrap items-baseline gap-2 font-serif">
                      <span className="font-mono text-base font-extrabold uppercase text-[#32171D]">SLOW</span>
                      <span className="text-xs italic text-[#7B1E2B] font-semibold">(antonym / opposite)</span>
                      <span className="text-[#C49A6C] font-serif">→</span>
                      <span className="font-serif font-black text-lg text-[#7B1E2B]">FAST</span>
                    </div>
                  </div>

                  <div className="border-l-2 border-[#C49A6C]/40 pl-3.5 py-1">
                    <div className="flex flex-wrap items-baseline gap-2 font-serif">
                      <span className="font-mono text-base font-extrabold uppercase text-[#32171D]">MEAL</span>
                      <span className="text-xs italic text-[#6B4E55] font-semibold">(synonym / similar)</span>
                      <span className="text-[#C49A6C] font-serif">→</span>
                      <span className="font-serif font-black text-lg text-[#7B1E2B]">FOOD</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#C49A6C]/20 text-center font-serif">
                  <p className="text-xs text-[#6B4E55]">
                    Combined target phrase:{" "}
                    <strong className="text-[#7B1E2B] text-base font-black">FAST FOOD</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3.5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#7B1E2B] block">
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
                className="rounded-2xl border border-[#C49A6C]/60 bg-white p-4 text-center shadow-xs"
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
                <div className="mb-2 text-xs font-semibold text-[#8C6870]">
                  Try typing: <strong>A S T</strong> then <strong>O O D</strong>
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                  {/* Word 0 */}
                  <div className="flex gap-1.5">
                    {practiceWord0.map((letter, idx) => {
                      const isFixed = idx === 0;
                      const isSelected =
                        selectedSlot.wordIndex === 0 && selectedSlot.letterIndex === idx;
                      return (
                        <button
                          key={`p0-${idx}`}
                          type="button"
                          disabled={isFixed}
                          onClick={() =>
                            !isFixed && setSelectedSlot({ wordIndex: 0, letterIndex: idx })
                          }
                          className={`flex h-11 w-9 sm:h-12 sm:w-10 items-center justify-center rounded-lg border-2 text-base sm:text-lg font-bold transition-all duration-200 ease-out ${
                            isFixed
                              ? "bg-[#32171D] text-[#C49A6C] border-[#C49A6C]"
                              : isSelected
                                ? "border-[#7B1E2B] ring-2 ring-[#7B1E2B] ring-offset-1 bg-white active:scale-[0.96]"
                                : letter
                                  ? "bg-[#faeee0] border-[#C49A6C] text-[#32171D] active:scale-[0.96]"
                                  : "bg-[#F7F0E5] border-[#C49A6C]/60 text-[#32171D] active:scale-[0.96]"
                          }`}
                        >
                          {letter}
                        </button>
                      );
                    })}
                  </div>

                  {/* Word 1 */}
                  <div className="flex gap-1.5">
                    {practiceWord1.map((letter, idx) => {
                      const isFixed = idx === 0;
                      const isSelected =
                        selectedSlot.wordIndex === 1 && selectedSlot.letterIndex === idx;
                      return (
                        <button
                          key={`p1-${idx}`}
                          type="button"
                          disabled={isFixed}
                          onClick={() =>
                            !isFixed && setSelectedSlot({ wordIndex: 1, letterIndex: idx })
                          }
                          className={`flex h-11 w-9 sm:h-12 sm:w-10 items-center justify-center rounded-lg border-2 text-base sm:text-lg font-bold transition-all duration-200 ease-out ${
                            isFixed
                              ? "bg-[#32171D] text-[#C49A6C] border-[#C49A6C]"
                              : isSelected
                                ? "border-[#7B1E2B] ring-2 ring-[#7B1E2B] ring-offset-1 bg-white active:scale-[0.96]"
                                : letter
                                  ? "bg-[#faeee0] border-[#C49A6C] text-[#32171D] active:scale-[0.96]"
                                  : "bg-[#F7F0E5] border-[#C49A6C]/60 text-[#32171D] active:scale-[0.96]"
                          }`}
                        >
                          {letter}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {isPracticeSolved ? (
                  <div className="mt-3 rounded-xl bg-[#faeee0] border border-[#C49A6C] p-2 text-xs font-bold text-[#7B1E2B]">
                    Correct! Notice that victory triggered automatically without clicking Submit.
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={resetPractice}
                    className="mt-3 text-xs text-[#8C6870] hover:text-[#32171D] underline cursor-pointer transition-colors duration-200"
                  >
                    Reset Grid
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-[#C49A6C]/40 bg-white p-4 space-y-3 shadow-xs">
                <div>
                  <h4 className="font-bold text-[#32171D] text-sm">60-Second Countdown</h4>
                  <p className="mt-0.5 text-xs text-[#6B4E55] leading-relaxed">
                    You have exactly 60 seconds per round. The score starts at 100 and decreases
                    by 1 point every 5 seconds.
                  </p>
                </div>

                <div className="border-t border-[#C49A6C]/20 pt-2.5">
                  <h4 className="font-bold text-[#32171D] text-sm">
                    Strategic Hints (-5 Points)
                  </h4>
                  <p className="mt-0.5 text-xs text-[#6B4E55] leading-relaxed">
                    Need a nudge? Use a hint to reveal the next letter in reading order. Each hint
                    deducts 5 points from your final score.
                  </p>
                </div>

                <div className="border-t border-[#C49A6C]/20 pt-2.5">
                  <h4 className="font-bold text-[#32171D] text-sm">Two Ways to Play</h4>
                  <p className="mt-0.5 text-xs text-[#6B4E55] leading-relaxed">
                    <strong>Daily:</strong> One official challenge per day synchronized worldwide.
                    <br />
                    <strong>Classic:</strong> Timed sprints with continuous puzzle flow.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between border-t border-[#C49A6C]/40 pt-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="rounded-full border border-[#C49A6C] px-4 py-1.5 text-xs font-semibold text-[#32171D] hover:bg-[#faeee0] active:scale-[0.96] transition-all duration-200 ease-out cursor-pointer"
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSkip}
              className="text-xs font-semibold text-[#8C6870] hover:text-[#32171D] transition-colors duration-200 cursor-pointer"
            >
              Skip Tutorial
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="rounded-full bg-[#7B1E2B] px-5 py-2 text-xs font-bold text-[#F7F0E5] shadow-xs hover:bg-[#631722] hover:shadow-sm active:scale-[0.96] transition-all duration-200 ease-out cursor-pointer"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleComplete}
              data-testid="start-playing-button"
              className="rounded-full bg-[#7B1E2B] px-6 py-2 text-xs font-bold text-[#F7F0E5] shadow-xs hover:bg-[#631722] hover:shadow-sm active:scale-[0.96] transition-all duration-200 ease-out cursor-pointer"
            >
              Start Playing
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
