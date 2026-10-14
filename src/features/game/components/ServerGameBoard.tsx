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
  const [roundStatus, setRoundStatus] = useState<"READY" | "PLAYING" | "WON" | "TIMED_OUT">(
    "READY"
  );
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
    const diff = Math.max(0, Math.ceil((deadlineMs.current - now) / 1000));
    setRemainingSeconds(diff);
    return diff;
  }, []);

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

    // Advance cursor to next slot
    if (letterIndex < grid.words[wordIndex].length - 1) {
      setSelectedPosition({ wordIndex, letterIndex: letterIndex + 1 });
    } else if (wordIndex === 0) {
      setSelectedPosition({ wordIndex: 1, letterIndex: 1 });
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

  // Clear tile
  const handleClearTile = () => {
    if (!selectedPosition || roundStatus !== "PLAYING") return;
    const { wordIndex, letterIndex } = selectedPosition;
    const currentTile = grid.words[wordIndex][letterIndex];
    if (!currentTile || currentTile.isFixed) return;

    if (currentTile.letter) {
      // Clear current letter
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
    } else {
      // Step back
      if (letterIndex > 1) {
        setSelectedPosition({ wordIndex, letterIndex: letterIndex - 1 });
      } else if (wordIndex === 1) {
        setSelectedPosition({ wordIndex: 0, letterIndex: grid.words[0].length - 1 });
      }
    }
  };

  // Use hint
  const handleUseHint = async (): Promise<{ success: boolean; message: string }> => {
    if (roundStatus === "WON" || roundStatus === "TIMED_OUT") {
      return { success: false, message: "Round is already finished." };
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
      />

      {/* Main Interactive Grid */}
      <section className="w-full" aria-label="Interactive Letter Grid">
        <LetterGrid
          grid={grid}
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
            className="flex items-center justify-center gap-2 rounded-xl bg-[#7B1E2B] px-8 py-2.5 text-sm sm:text-base font-extrabold text-[#F7F0E5] shadow-md hover:bg-[#7B1E2B]/90 active:scale-95 transition-all disabled:opacity-50 border border-[#C49A6C]/40 cursor-pointer"
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
              className="absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#32171D] text-[#F7F0E5] border border-[#C49A6C] shadow-md hover:bg-[#7B1E2B] transition font-bold text-sm cursor-pointer"
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
