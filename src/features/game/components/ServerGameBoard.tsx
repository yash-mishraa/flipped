"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import type {
  LetterGrid as LetterGridType,
  LetterTile,
  TilePosition,
  Puzzle,
  TerminalResult,
} from "../domain/types";
import type {
  SafeGameplayPayload,
  FinalizedResultPayload,
} from "@/server/puzzles/puzzle-repository";
import { LetterGrid } from "./LetterGrid";
import { HintControl } from "./HintControl";
import { GameHUD } from "./GameHUD";
import { SuccessScreen } from "./SuccessScreen";
import { TimeoutScreen } from "./TimeoutScreen";
import { GameInstructions } from "./GameInstructions";
import { formatTime, getTimerUrgency } from "../domain/timer-utils";
import { getNextEditablePosition, getPreviousEditablePosition } from "../domain/letter-grid";
import { cn } from "@/lib/utils";

export interface ServerGameBoardProps {
  readonly payload: SafeGameplayPayload;
  readonly mode: "DAILY" | "CLASSIC";
  readonly onFinalized?: (result: FinalizedResultPayload) => void;
  readonly onNextClassic?: () => void;
}

/**
 * Initializes a client letter grid from safe server payload (where target answers are absent).
 * Only the first letter of each word is fixed; remaining slots are initialized empty.
 */
function createSafeInitialGrid(payload: SafeGameplayPayload): LetterGridType {
  const createWordTiles = (
    firstLetter: string,
    length: number,
    wordIndex: 0 | 1
  ): readonly LetterTile[] => {
    const tiles: LetterTile[] = [];
    for (let i = 0; i < length; i++) {
      if (i === 0) {
        tiles.push({
          wordIndex,
          letterIndex: 0,
          letter: firstLetter.toUpperCase(),
          isFixed: true,
          isEntered: false,
          isEvaluated: true,
          feedback: "CONFIRMED",
        });
      } else {
        tiles.push({
          wordIndex,
          letterIndex: i,
          letter: "",
          isFixed: false,
          isEntered: false,
          isEvaluated: false,
          feedback: "NONE",
        });
      }
    }
    return tiles;
  };

  return {
    words: [
      createWordTiles(payload.firstLetters[0], payload.wordLengths[0], 0),
      createWordTiles(payload.firstLetters[1], payload.wordLengths[1], 1),
    ],
  };
}

export function ServerGameBoard({
  payload,
  mode,
  onFinalized,
  onNextClassic,
}: ServerGameBoardProps): React.JSX.Element {
  const [grid, setGrid] = useState<LetterGridType>(() => createSafeInitialGrid(payload));
  const [selectedPosition, setSelectedPosition] = useState<TilePosition | null>(() => ({
    wordIndex: 0,
    letterIndex: 1,
  }));

  // Detect if this is a fresh daily attempt (<5s from payload.startedAt) vs an in-progress resumed attempt
  const isFreshDaily =
    mode === "DAILY" && Date.now() - new Date(payload.startedAt).getTime() < 5000;
  const isResumedDaily = mode === "DAILY" && !isFreshDaily;

  const [countdown, setCountdown] = useState<number | null>(() => {
    if (!isFreshDaily) return null;
    const elapsed = (Date.now() - new Date(payload.startedAt).getTime()) / 1000;
    return Math.max(1, Math.min(5, Math.ceil(5 - elapsed)));
  });

  const [roundStatus, setRoundStatus] = useState<"READY" | "PLAYING" | "WON" | "TIMED_OUT">(() => {
    if (isResumedDaily) return "PLAYING";
    return "READY";
  });
  const [hintsUsed, setHintsUsed] = useState<number>(payload.hintsUsed);
  const [finalizedResult, setFinalizedResult] = useState<FinalizedResultPayload | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showWinModal, setShowWinModal] = useState<boolean>(true);

  // Authoritative server deadline
  const deadlineMs = useRef<number>(new Date(payload.deadline).getTime());
  const [remainingSeconds, setRemainingSeconds] = useState<number>(60);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Recalculate remaining seconds
  const updateTimer = useCallback(() => {
    const now = Date.now();
    const diff = Math.max(0, Math.min(60, Math.ceil((deadlineMs.current - now) / 1000)));
    setRemainingSeconds(diff);
    return diff;
  }, []);

  // 5-second countdown timer for daily mode: auto-starts gameplay when countdown reaches 0
  useEffect(() => {
    if (countdown === null) return;

    if (countdown <= 0) {
      setCountdown(null);
      setRoundStatus("PLAYING");
      updateTimer();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          setRoundStatus("PLAYING");
          updateTimer();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, updateTimer]);

  // Handle server timeout
  const handleTimeout = useCallback(async () => {
    if (roundStatus === "WON" || roundStatus === "TIMED_OUT") return;

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    try {
      const res = await fetch(`/api/game/attempt/${payload.attemptId}/timeout`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.result) {
        setFinalizedResult(data.result);
        setRoundStatus("TIMED_OUT");
        onFinalized?.(data.result);
      }
    } catch {
      setRoundStatus("TIMED_OUT");
    }
  }, [payload.attemptId, roundStatus, onFinalized]);

  // Start round
  const handleStartRound = () => {
    setCountdown(null);
    setRoundStatus("PLAYING");
    updateTimer();
  };

  // Timer interval while playing
  useEffect(() => {
    if (roundStatus !== "PLAYING") {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      const remaining = updateTimer();
      if (remaining <= 0) {
        handleTimeout();
      }
    }, 250);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [roundStatus, updateTimer, handleTimeout]);

  // Tab visibility synchronization
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && roundStatus === "PLAYING") {
        const remaining = updateTimer();
        if (remaining <= 0) {
          handleTimeout();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [roundStatus, updateTimer, handleTimeout]);

  // Tile Selection
  const handleSelectTile = (pos: TilePosition | null) => {
    if (roundStatus !== "PLAYING") return;
    if (pos) {
      const tile = grid.words[pos.wordIndex][pos.letterIndex];
      if (tile && tile.isFixed) return;
    }
    setSelectedPosition(pos);
  };

  // Letter navigation
  const handleNavigate = (direction: "left" | "right" | "up" | "down" | "home" | "end") => {
    if (!selectedPosition || roundStatus !== "PLAYING") return;
    const { wordIndex, letterIndex } = selectedPosition;

    if (direction === "left") {
      if (letterIndex > 1) {
        setSelectedPosition({ wordIndex, letterIndex: letterIndex - 1 });
      } else if (wordIndex === 1) {
        setSelectedPosition({ wordIndex: 0, letterIndex: grid.words[0].length - 1 });
      }
    } else if (direction === "right") {
      if (letterIndex < grid.words[wordIndex].length - 1) {
        setSelectedPosition({ wordIndex, letterIndex: letterIndex + 1 });
      } else if (wordIndex === 0) {
        setSelectedPosition({ wordIndex: 1, letterIndex: 1 });
      }
    } else if (direction === "up" || direction === "down") {
      const targetWord = wordIndex === 0 ? 1 : 0;
      const targetLen = grid.words[targetWord].length;
      const targetLetter = Math.min(Math.max(1, letterIndex), targetLen - 1);
      setSelectedPosition({ wordIndex: targetWord, letterIndex: targetLetter });
    } else if (direction === "home") {
      setSelectedPosition({ wordIndex, letterIndex: 1 });
    } else if (direction === "end") {
      setSelectedPosition({ wordIndex, letterIndex: grid.words[wordIndex].length - 1 });
    }
  };

  // Submit candidate phrase to server
  const submitCandidatePhrase = useCallback(
    async (phraseToSubmit: string) => {
      if (isSubmitting || roundStatus !== "PLAYING") return;
      setIsSubmitting(true);
      setErrorMessage(null);

      try {
        const res = await fetch(`/api/game/attempt/${payload.attemptId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phrase: phraseToSubmit }),
        });

        const data = await res.json();

        if (data.status === "WON") {
          setGrid((prevGrid) => ({
            words: [
              prevGrid.words[0].map((tile) => ({ ...tile, feedback: "CONFIRMED" as const })),
              prevGrid.words[1].map((tile) => ({ ...tile, feedback: "CONFIRMED" as const })),
            ],
          }));
          setFinalizedResult(data.result);
          setRoundStatus("WON");
          setShowWinModal(true);
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          onFinalized?.(data.result);
        } else if (data.status === "TIMED_OUT") {
          setFinalizedResult(data.result);
          setRoundStatus("TIMED_OUT");
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          onFinalized?.(data.result);
        } else if (data.status === "INCORRECT") {
          if (data.tileFeedback) {
            setGrid((prevGrid) => {
              const [fb0, fb1] = data.tileFeedback as [LetterTile["feedback"][], LetterTile["feedback"][]];
              return {
                words: [
                  prevGrid.words[0].map((tile, i) => ({
                    ...tile,
                    feedback: fb0?.[i] ?? tile.feedback,
                  })),
                  prevGrid.words[1].map((tile, i) => ({
                    ...tile,
                    feedback: fb1?.[i] ?? tile.feedback,
                  })),
                ],
              };
            });
          }
          setErrorMessage("Some letters are incorrect. Incorrect letters are marked on the board.");
        } else if (data.status === "ALREADY_FINALIZED") {
          setFinalizedResult(data.result);
          setRoundStatus(data.result.isWon ? "WON" : "TIMED_OUT");
          if (data.result.isWon) setShowWinModal(true);
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          onFinalized?.(data.result);
        } else {
          setErrorMessage(data.message || data.error || "Unable to verify answer. Please try again.");
        }
      } catch {
        setErrorMessage("Network error verifying answer. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, roundStatus, payload.attemptId, onFinalized]
  );

  // Explicit submit / Enter key handler
  const handleSubmitCurrentBoard = useCallback(() => {
    if (roundStatus !== "PLAYING" || isSubmitting) return;

    const w0 = grid.words[0].map((t) => t.letter).join("");
    const w1 = grid.words[1].map((t) => t.letter).join("");

    if (w0.length < grid.words[0].length || w1.length < grid.words[1].length) {
      setErrorMessage("Please complete both words before checking your answer.");
      return;
    }

    const phrase = `${w0} ${w1}`;
    submitCandidatePhrase(phrase);
  }, [grid.words, isSubmitting, roundStatus, submitCandidatePhrase]);

  // Input letter into selected tile
  const handleInputLetter = (rawLetter: string) => {
    if (!selectedPosition || roundStatus !== "PLAYING") return;
    const clean = rawLetter.trim().toUpperCase().slice(0, 1);
    if (!clean) return;

    const { wordIndex, letterIndex } = selectedPosition;
    const currentTile = grid.words[wordIndex][letterIndex];
    if (!currentTile || currentTile.isFixed) return;

    setErrorMessage(null);

    const updatedWords = [...grid.words] as [readonly LetterTile[], readonly LetterTile[]];
    const newWordTiles = [...updatedWords[wordIndex]];
    newWordTiles[letterIndex] = {
      ...currentTile,
      letter: clean,
      isEntered: true,
      feedback: "NONE",
    };
    updatedWords[wordIndex] = newWordTiles;

    const newGrid: LetterGridType = { words: updatedWords };
    setGrid(newGrid);

    // Advance cursor to next editable slot
    const nextPos = getNextEditablePosition(newGrid, selectedPosition);
    if (nextPos) {
      setSelectedPosition(nextPos);
    }

    // Check if entire grid is now filled
    const word0Filled = updatedWords[0].every((t) => Boolean(t.letter));
    const word1Filled = updatedWords[1].every((t) => Boolean(t.letter));

    if (word0Filled && word1Filled) {
      const phrase = `${updatedWords[0].map((t) => t.letter).join("")} ${updatedWords[1]
        .map((t) => t.letter)
        .join("")}`;
      submitCandidatePhrase(phrase);
    }
  };

  // Clear tile (Backspace / Delete)
  const handleClearTile = () => {
    if (!selectedPosition || roundStatus !== "PLAYING") return;
    const { wordIndex, letterIndex } = selectedPosition;
    const currentTile = grid.words[wordIndex][letterIndex];
    if (!currentTile) return;

    if (!currentTile.isFixed && currentTile.letter) {
      // 1. Current tile has a letter -> clear this tile immediately
      const updatedWords = [...grid.words] as [readonly LetterTile[], readonly LetterTile[]];
      const newWordTiles = [...updatedWords[wordIndex]];
      newWordTiles[letterIndex] = {
        ...currentTile,
        letter: "",
        isEntered: false,
        feedback: "NONE",
      };
      updatedWords[wordIndex] = newWordTiles;
      setGrid({ words: updatedWords });
      setErrorMessage(null);
    } else {
      // 2. Current tile is empty OR is fixed -> find previous editable tile, clear it, and move cursor to it
      const prevPos = getPreviousEditablePosition(grid, selectedPosition);
      if (prevPos) {
        const prevTile = grid.words[prevPos.wordIndex][prevPos.letterIndex];
        if (prevTile && !prevTile.isFixed) {
          const updatedWords = [...grid.words] as [readonly LetterTile[], readonly LetterTile[]];
          const targetWordTiles = [...updatedWords[prevPos.wordIndex]];
          targetWordTiles[prevPos.letterIndex] = {
            ...prevTile,
            letter: "",
            isEntered: false,
            feedback: "NONE",
          };
          updatedWords[prevPos.wordIndex] = targetWordTiles;
          setGrid({ words: updatedWords });
          setSelectedPosition(prevPos);
          setErrorMessage(null);
        }
      }
    }
  };

  // Use hint
  const handleUseHint = async (): Promise<{ success: boolean; message: string }> => {
    if (roundStatus === "WON" || roundStatus === "TIMED_OUT") {
      return { success: false, message: "Round is already finished." };
    }

    if (countdown !== null) {
      return { success: false, message: "Countdown in progress. Game has not started yet." };
    }

    if (roundStatus === "READY") {
      handleStartRound();
    }

    try {
      const res = await fetch(`/api/game/attempt/${payload.attemptId}/hint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enteredWords: grid.words.map((word) =>
            word.map((tile) => (tile.letter ? tile.letter : " ")).join("")
          ),
        }),
      });
      const data = await res.json();

      if (
        data.success &&
        data.wordIndex !== undefined &&
        data.letterIndex !== undefined &&
        data.letter
      ) {
        const wordIdx = data.wordIndex as 0 | 1;
        const letterIdx = data.letterIndex as number;
        const letter = data.letter as string;
        const newHintsCount = data.hintsUsed as number;

        const updatedWords = [...grid.words] as [readonly LetterTile[], readonly LetterTile[]];
        const newWordTiles = [...updatedWords[wordIdx]];
        newWordTiles[letterIdx] = {
          wordIndex: wordIdx,
          letterIndex: letterIdx,
          letter: letter.toUpperCase(),
          isFixed: true, // Lock revealed hint tile
          isEntered: true,
          isEvaluated: true,
          feedback: "CONFIRMED",
        };
        updatedWords[wordIdx] = newWordTiles;
        setGrid({ words: updatedWords });
        setHintsUsed(newHintsCount);

        // Advance cursor if current tile was revealed
        if (selectedPosition?.wordIndex === wordIdx && selectedPosition?.letterIndex === letterIdx) {
          if (letterIdx < grid.words[wordIdx].length - 1) {
            setSelectedPosition({ wordIndex: wordIdx, letterIndex: letterIdx + 1 });
          } else if (wordIdx === 0) {
            setSelectedPosition({ wordIndex: 1, letterIndex: 1 });
          }
        }

        // Check if all tiles are filled after hint
        const word0Filled = updatedWords[0].every((t) => Boolean(t.letter));
        const word1Filled = updatedWords[1].every((t) => Boolean(t.letter));
        if (word0Filled && word1Filled) {
          const phrase = `${updatedWords[0].map((t) => t.letter).join("")} ${updatedWords[1]
            .map((t) => t.letter)
            .join("")}`;
          submitCandidatePhrase(phrase);
        }

        return {
          success: true,
          message: `Revealed "${letter}" at Word ${wordIdx + 1}, Letter ${letterIdx + 1} (-5 pts)`,
        };
      } else {
        return { success: false, message: data.message || "Hint unavailable." };
      }
    } catch {
      return { success: false, message: "Network error requesting hint." };
    }
  };

  // Dummy puzzle object to fulfill HUD and Result screens
  const safePuzzleView: Puzzle = {
    id: payload.puzzleId,
    clueWords: payload.clueWords,
    answerWords: finalizedResult
      ? (finalizedResult.canonicalPhrase.split(" ") as [string, string])
      : [payload.firstLetters[0], payload.firstLetters[1]],
    transformations: finalizedResult
      ? [
          {
            clueWord: finalizedResult.transformations[0]!.clueWord,
            answerWord: finalizedResult.transformations[0]!.answerWord,
            relationship: finalizedResult.transformations[0]!.relationship,
            explanation: finalizedResult.transformations[0]!.explanation,
          },
          {
            clueWord: finalizedResult.transformations[1]!.clueWord,
            answerWord: finalizedResult.transformations[1]!.answerWord,
            relationship: finalizedResult.transformations[1]!.relationship,
            explanation: finalizedResult.transformations[1]!.explanation,
          },
        ]
      : [
          {
            clueWord: payload.transformations[0].clueWord,
            answerWord: "???",
            relationship: payload.transformations[0].relationship,
            explanation: "Revealed on puzzle completion.",
          },
          {
            clueWord: payload.transformations[1].clueWord,
            answerWord: "???",
            relationship: payload.transformations[1].relationship,
            explanation: "Revealed on puzzle completion.",
          },
        ],
    difficulty: payload.difficulty,
  };

  const formattedTime = formatTime(remainingSeconds);
  const urgency = getTimerUrgency(remainingSeconds);
  const isRoundOver = roundStatus === "WON" || roundStatus === "TIMED_OUT";

  const isMasked = countdown !== null && countdown > 0;

  // Mask grid tiles during countdown so fixed first letters are completely hidden
  const displayedGrid: LetterGridType = isMasked
    ? {
        words: [
          grid.words[0].map((tile) => ({ ...tile, letter: "" })),
          grid.words[1].map((tile) => ({ ...tile, letter: "" })),
        ],
      }
    : grid;

  const terminalResultView: TerminalResult = finalizedResult
    ? {
        roundId: finalizedResult.attemptId,
        status: finalizedResult.status,
        finalScore: finalizedResult.finalScore,
        elapsedSeconds: finalizedResult.elapsedSeconds,
        hintsUsed: finalizedResult.hintsUsed,
        solvedPhrase: finalizedResult.solvedPhrase,
        completedAt: finalizedResult.completedAt,
      }
    : {
        roundId: payload.attemptId,
        status: "TIMED_OUT",
        finalScore: 0,
        elapsedSeconds: 60,
        hintsUsed,
        completedAt: new Date().toISOString(),
      };

  return (
    <div className="flex w-full flex-col items-center gap-6" data-testid="server-game-board">
      {/* 5-Second Countdown Pop-up Modal */}
      {countdown !== null && countdown > 0 && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Daily Challenge Countdown"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in"
          data-testid="daily-countdown-modal"
        >
          <div className="relative flex w-full max-w-sm flex-col items-center rounded-3xl border-2 border-[#C49A6C] bg-[#FDFBF7] p-8 text-center shadow-2xl">
            <span className="rounded-full border border-[#C49A6C]/60 bg-[#faeee0] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#7B1E2B]">
              Daily Challenge
            </span>

            <h2 className="mt-4 text-2xl font-black tracking-tight text-[#32171D] sm:text-3xl">
              The game will start in
            </h2>

            <div className="my-6 flex items-center justify-center">
              <div
                key={countdown}
                data-testid="countdown-digit"
                className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#7B1E2B] bg-[#faeee0] text-5xl font-black text-[#7B1E2B] shadow-inner transition-transform duration-300 animate-scale-in"
              >
                {countdown}
              </div>
            </div>

            <p className="text-sm font-semibold text-[#6B4E55]">
              Get ready! The clues will be revealed when the timer starts.
            </p>

            <div className="mt-4 rounded-xl border border-[#C49A6C]/40 bg-[#faeee0]/50 px-4 py-2 text-xs text-[#8C6870]">
              60 seconds • Single attempt • Clues unlock at 0
            </div>
          </div>
        </div>
      )}

      {/* Mobile Floating Sticky Header Timer — stays visible throughout active gameplay on mobile */}
      {roundStatus === "PLAYING" && (
        <div
          data-testid="mobile-sticky-timer"
          className="fixed top-2.5 left-1/2 -translate-x-1/2 z-50 sm:hidden pointer-events-none"
        >
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black tabular-nums font-mono shadow-md backdrop-blur-md transition-all duration-200",
              urgency === "critical"
                ? "border-[#7B1E2B] bg-[#7B1E2B] text-[#F7F0E5] animate-pulse shadow-red-200"
                : urgency === "urgent"
                  ? "border-[#C49A6C] bg-[#faeee0] text-[#7B1E2B]"
                  : "border-[#C49A6C] bg-white/95 text-[#32171D]"
            )}
          >
            <span className="font-mono text-xs font-black tracking-wider">
              ⏱ {formattedTime}
            </span>
          </div>
        </div>
      )}

      {/* Top HUD */}
      <GameHUD
        puzzle={safePuzzleView}
        roundStatus={roundStatus}
        formattedTime={formattedTime}
        urgency={urgency}
        isRunning={roundStatus === "PLAYING"}
        score={Math.max(0, 100 - Math.floor((60 - remainingSeconds) / 5) - hintsUsed * 5)}
        hintsUsed={hintsUsed}
        onStartGame={handleStartRound}
        onRestart={() => {}}
        isMasked={isMasked}
        hideStartButton={mode === "DAILY"}
      />

      {/* Main Interactive Grid */}
      <section className="w-full" aria-label="Interactive Letter Grid">
        <LetterGrid
          grid={displayedGrid}
          selectedPosition={selectedPosition}
          isRoundOver={!Boolean(roundStatus === "PLAYING")}
          onSelectTile={handleSelectTile}
          onInputLetter={handleInputLetter}
          onClearTile={handleClearTile}
          onNavigate={handleNavigate}
          onEnter={handleSubmitCurrentBoard}
        />
      </section>

      {/* Manual Check Answer Button & Keyboard Enter Hint */}
      {roundStatus === "PLAYING" && (
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleSubmitCurrentBoard}
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#7B1E2B] px-8 py-2.5 text-sm sm:text-base font-extrabold text-[#F7F0E5] shadow-md hover:bg-[#7B1E2B]/90 active:scale-[0.97] transition-all duration-200 ease-out disabled:opacity-50 border border-[#C49A6C]/40 cursor-pointer"
          >
            {isSubmitting ? "Checking Answer..." : "Check Answer"}
          </button>
          <span className="text-[11px] font-semibold text-[#8C6870]">
            Or press <kbd className="rounded border border-[#C49A6C]/50 bg-[#faeee0] px-1 py-0.5 text-[10px] font-bold text-[#32171D]">Enter</kbd> to submit
          </span>
        </div>
      )}

      {/* Inline Feedback Banner */}
      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-coral-200 bg-coral-50 px-4 py-2 text-center text-xs font-semibold text-coral-800 animate-fade-in"
        >
          {errorMessage}
        </div>
      )}

      {/* Hint Controls */}
      {!isRoundOver && (
        <section aria-label="Hint Actions">
          <HintControl hintsUsed={hintsUsed} isRoundOver={isRoundOver} onUseHint={handleUseHint} />
        </section>
      )}

      {/* Winning Pop-up Modal Dialog */}
      {showWinModal && roundStatus === "WON" && finalizedResult && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Victory Summary"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in"
        >
          <div className="relative w-full max-w-lg my-8">
            <button
              type="button"
              onClick={() => setShowWinModal(false)}
              aria-label="Close victory popup"
              className="absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#32171D] text-[#F7F0E5] border border-[#C49A6C] shadow-md hover:bg-[#7B1E2B] transition-all duration-200 ease-out active:scale-[0.92] font-bold text-sm cursor-pointer"
            >
              ✕
            </button>
            <SuccessScreen
              puzzle={safePuzzleView}
              terminalResult={terminalResultView}
              mode={mode}
              date={payload.date}
              onNextPuzzle={() => {
                setShowWinModal(false);
                onNextClassic?.();
              }}
              nextPuzzleLabel="Next Classic Puzzle"
            />
          </div>
        </div>
      )}

      {/* Result Screens */}
      <section className="w-full" aria-label="Round Status & Results">
        {roundStatus === "WON" && finalizedResult && !showWinModal && (
          <SuccessScreen
            puzzle={safePuzzleView}
            terminalResult={terminalResultView}
            mode={mode}
            date={payload.date}
            onNextPuzzle={onNextClassic}
            nextPuzzleLabel="Next Classic Puzzle"
          />
        )}

        {roundStatus === "TIMED_OUT" && finalizedResult && (
          <TimeoutScreen
            puzzle={safePuzzleView}
            terminalResult={terminalResultView}
            mode={mode}
            date={payload.date}
            onNextPuzzle={onNextClassic}
            nextPuzzleLabel="Next Classic Puzzle"
          />
        )}
      </section>

      {/* Instructions */}
      <section className="mt-2 w-full" aria-label="Instructions">
        <GameInstructions />
      </section>
    </div>
  );
}
