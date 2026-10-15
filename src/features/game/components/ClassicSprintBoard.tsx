"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Show, SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import { syncUserProgress } from "../persistence/user-sync";
import type {
  Difficulty,
  LetterGrid as LetterGridType,
  LetterTile,
  TilePosition,
} from "../domain/types";
import type { SafeGameplayPayload } from "@/server/puzzles/puzzle-repository";
import { DifficultySelector } from "./DifficultySelector";
import { ClassicDurationSelector } from "./ClassicDurationSelector";
import { LetterGrid } from "./LetterGrid";
import { HintControl } from "./HintControl";
import { ShareButton } from "./ShareButton";
import { formatTime, getTimerUrgency } from "../domain/timer-utils";
import { getNextEditablePosition, getPreviousEditablePosition } from "../domain/letter-grid";
import {
  getClassicLastDifficulty,
  getClassicRecentPuzzleIds,
  recordClassicGame,
  loadProgress,
} from "../persistence/local-progress";
import { calculateScore } from "../domain/scoring";

export interface SolvedSprintPuzzle {
  readonly puzzleId: string;
  readonly clueWords: readonly [string, string];
  readonly solvedPhrase: string;
  readonly score: number;
  readonly elapsedSeconds: number;
  readonly hintsUsed: number;
  readonly transformations?: readonly {
    readonly clueWord: string;
    readonly answerWord: string;
    readonly relationship: string;
    readonly explanation: string;
  }[];
}

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

export function ClassicSprintBoard(): React.JSX.Element {
  const { isSignedIn, user } = useUser();

  // Config state
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [durationSeconds, setDurationSeconds] = useState<number>(180); // Default: 3 minutes

  // Game state: LOBBY -> PLAYING -> FINISHED
  const [gameState, setGameState] = useState<"LOBBY" | "PLAYING" | "FINISHED">("LOBBY");
  const [loadingNext, setLoadingNext] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (gameState === "FINISHED" && isSignedIn && user?.id) {
      syncUserProgress(user.id);
    }
  }, [gameState, isSignedIn, user?.id]);

  // Sprint Progress
  const [sprintTimeRemaining, setSprintTimeRemaining] = useState<number>(180);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [solvedList, setSolvedList] = useState<SolvedSprintPuzzle[]>([]);
  const [celebrationToast, setCelebrationToast] = useState<string | null>(null);

  // Current Puzzle State
  const [currentPayload, setCurrentPayload] = useState<SafeGameplayPayload | null>(null);
  const [grid, setGrid] = useState<LetterGridType | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<TilePosition | null>(null);
  const [currentHintsUsed, setCurrentHintsUsed] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const puzzleStartTimestampRef = useRef<number>(Date.now());

  // Sprint Global Timer Ref
  const sprintEndTimeRef = useRef<number>(0);
  const sprintTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recentIdsRef = useRef<string[]>([]);

  // Load progress on mount
  useEffect(() => {
    const initialDifficulty = getClassicLastDifficulty();
    recentIdsRef.current = [...getClassicRecentPuzzleIds()];
    setDifficulty(initialDifficulty);
  }, []);

  // Fetch a puzzle from server
  const fetchPuzzle = useCallback(
    async (tier: Difficulty): Promise<SafeGameplayPayload | null> => {
      try {
        const res = await fetch("/api/game/classic/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            difficulty: tier,
            recentPuzzleIds: recentIdsRef.current,
            durationSeconds: 600, // Safe high limit so server attempt doesn't expire during sprint
          }),
        });

        const data = await res.json();
        if (data.status === "STARTED") {
          recentIdsRef.current = [data.payload.puzzleId, ...recentIdsRef.current.slice(0, 30)];
          return data.payload;
        } else {
          setErrorMsg(data.message || "Failed to load next puzzle.");
          return null;
        }
      } catch {
        setErrorMsg("Network error connecting to game server.");
        return null;
      }
    },
    []
  );

  // Start Sprint
  const handleStartSprint = async () => {
    setErrorMsg(null);
    setLoadingNext(true);
    setTotalScore(0);
    setSolvedList([]);
    setCelebrationToast(null);

    const firstPayload = await fetchPuzzle(difficulty);
    if (!firstPayload) {
      setLoadingNext(false);
      return;
    }

    setCurrentPayload(firstPayload);
    setGrid(createSafeInitialGrid(firstPayload));
    setSelectedPosition({ wordIndex: 0, letterIndex: 1 });
    setCurrentHintsUsed(0);
    puzzleStartTimestampRef.current = Date.now();

    setSprintTimeRemaining(durationSeconds);
    sprintEndTimeRef.current = Date.now() + durationSeconds * 1000;
    setGameState("PLAYING");
    setLoadingNext(false);
  };

  // Timer interval while playing
  useEffect(() => {
    if (gameState !== "PLAYING") {
      if (sprintTimerIntervalRef.current) {
        clearInterval(sprintTimerIntervalRef.current);
        sprintTimerIntervalRef.current = null;
      }
      return;
    }

    sprintTimerIntervalRef.current = setInterval(() => {
      const remainingMs = sprintEndTimeRef.current - Date.now();
      const secondsLeft = Math.max(0, Math.ceil(remainingMs / 1000));
      setSprintTimeRemaining(secondsLeft);

      if (secondsLeft <= 0) {
        if (sprintTimerIntervalRef.current) {
          clearInterval(sprintTimerIntervalRef.current);
          sprintTimerIntervalRef.current = null;
        }
        setGameState("FINISHED");
      }
    }, 250);

    return () => {
      if (sprintTimerIntervalRef.current) {
        clearInterval(sprintTimerIntervalRef.current);
        sprintTimerIntervalRef.current = null;
      }
    };
  }, [gameState]);

  // Load next puzzle seamlessly during sprint
  const loadNextInSprint = useCallback(async () => {
    setLoadingNext(true);
    setErrorMsg(null);

    const nextPayload = await fetchPuzzle(difficulty);
    if (nextPayload) {
      setCurrentPayload(nextPayload);
      setGrid(createSafeInitialGrid(nextPayload));
      setSelectedPosition({ wordIndex: 0, letterIndex: 1 });
      setCurrentHintsUsed(0);
      puzzleStartTimestampRef.current = Date.now();
    }
    setLoadingNext(false);
  }, [difficulty, fetchPuzzle]);

  // Skip puzzle handler
  const handleSkipPuzzle = async () => {
    if (loadingNext || gameState !== "PLAYING") return;
    setCelebrationToast(`Skipped puzzle. Loading next word...`);
    setTimeout(() => setCelebrationToast(null), 2000);
    await loadNextInSprint();
  };

  // Submit candidate phrase to server
  const submitCandidatePhrase = useCallback(
    async (phraseToSubmit: string) => {
      if (isSubmitting || !currentPayload || gameState !== "PLAYING") return;
      setIsSubmitting(true);
      setErrorMsg(null);

      try {
        const res = await fetch(`/api/game/attempt/${currentPayload.attemptId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phrase: phraseToSubmit }),
        });

        const data = await res.json();

        if (data.status === "WON") {
          // Solved! Calculate score for this puzzle
          const solveTimeSec = Math.max(
            1,
            Math.round((Date.now() - puzzleStartTimestampRef.current) / 1000)
          );
          const puzzlePts = calculateScore(solveTimeSec, currentHintsUsed);

          setTotalScore((prev) => prev + puzzlePts);

          const solvedItem: SolvedSprintPuzzle = {
            puzzleId: currentPayload.puzzleId,
            clueWords: currentPayload.clueWords,
            solvedPhrase: data.result?.solvedPhrase || phraseToSubmit.toUpperCase(),
            score: puzzlePts,
            elapsedSeconds: solveTimeSec,
            hintsUsed: currentHintsUsed,
            transformations: data.result?.transformations,
          };

          setSolvedList((prev) => [solvedItem, ...prev]);
          recordClassicGame(currentPayload.puzzleId, difficulty, true, puzzlePts, solveTimeSec);

          setCelebrationToast(
            `+${puzzlePts} pts! "${solvedItem.solvedPhrase}" solved! Next word coming up...`
          );
          setTimeout(() => setCelebrationToast(null), 2500);

          // Immediately fetch and display next puzzle
          await loadNextInSprint();
        } else if (data.status === "INCORRECT") {
          if (data.tileFeedback && grid) {
            const [fb0, fb1] = data.tileFeedback as [
              LetterTile["feedback"][],
              LetterTile["feedback"][]
            ];
            setGrid((prevGrid) => {
              if (!prevGrid) return prevGrid;
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
          setErrorMsg("Some letters are incorrect. Incorrect letters are marked on the board.");
        } else {
          setErrorMsg(data.message || data.error || "Unable to verify answer.");
        }
      } catch {
        setErrorMsg("Network error verifying answer. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, currentPayload, gameState, currentHintsUsed, difficulty, grid, loadNextInSprint]
  );

  // Tile Selection
  const handleSelectTile = (pos: TilePosition | null) => {
    if (gameState !== "PLAYING") return;
    if (pos && grid) {
      const tile = grid.words[pos.wordIndex][pos.letterIndex];
      if (tile && tile.isFixed) return;
    }
    setSelectedPosition(pos);
  };

  // Letter navigation
  const handleNavigate = (direction: "left" | "right" | "up" | "down" | "home" | "end") => {
    if (!selectedPosition || !grid || gameState !== "PLAYING") return;
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

  // Input letter
  const handleInputLetter = (letter: string) => {
    if (!selectedPosition || !grid || gameState !== "PLAYING") return;

    const clean = letter.toUpperCase();
    if (!/^[A-Z]$/.test(clean)) return;

    const { wordIndex, letterIndex } = selectedPosition;
    const currentTile = grid.words[wordIndex][letterIndex];
    if (!currentTile || currentTile.isFixed) return;

    setErrorMsg(null);

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
    if (!selectedPosition || !grid || gameState !== "PLAYING") return;
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
      setErrorMsg(null);
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
          setErrorMsg(null);
        }
      }
    }
  };

  // Explicit submit
  const handleSubmitCurrentBoard = () => {
    if (!grid || gameState !== "PLAYING" || isSubmitting) return;

    const w0 = grid.words[0].map((t) => t.letter).join("");
    const w1 = grid.words[1].map((t) => t.letter).join("");

    if (w0.length < grid.words[0].length || w1.length < grid.words[1].length) {
      setErrorMsg("Please complete both words before checking.");
      return;
    }

    submitCandidatePhrase(`${w0} ${w1}`);
  };

  // Hint
  const handleUseHint = async (): Promise<{ success: boolean; message: string }> => {
    if (!currentPayload || !grid || gameState !== "PLAYING") {
      return { success: false, message: "Hint unavailable." };
    }

    try {
      const res = await fetch(`/api/game/attempt/${currentPayload.attemptId}/hint`, {
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
        const newHintsCount = (data.hintsUsed ?? currentHintsUsed + 1) as number;

        const updatedWords = [...grid.words] as [readonly LetterTile[], readonly LetterTile[]];
        const targetWordTiles = updatedWords[wordIdx];
        if (!targetWordTiles) return { success: false, message: "Invalid hint data." };

        const newWordTiles = [...targetWordTiles];
        const tileToUpdate = newWordTiles[letterIdx];
        if (!tileToUpdate) return { success: false, message: "Invalid hint slot." };

        newWordTiles[letterIdx] = {
          ...tileToUpdate,
          letter: letter.toUpperCase(),
          isFixed: true,
          isEntered: true,
          feedback: "CONFIRMED",
        };
        updatedWords[wordIdx] = newWordTiles;
        setGrid({ words: updatedWords });
        setCurrentHintsUsed(newHintsCount);

        // Advance cursor if current tile was revealed
        if (selectedPosition?.wordIndex === wordIdx && selectedPosition?.letterIndex === letterIdx) {
          if (letterIdx < grid.words[wordIdx].length - 1) {
            setSelectedPosition({ wordIndex: wordIdx, letterIndex: letterIdx + 1 });
          } else if (wordIdx === 0) {
            setSelectedPosition({ wordIndex: 1, letterIndex: 1 });
          }
        }

        // Check if all tiles filled after hint
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
          message: `Revealed letter "${letter.toUpperCase()}"`,
        };
      }
      return { success: false, message: data.message || "Hint limit reached." };
    } catch {
      return { success: false, message: "Network error requesting hint." };
    }
  };

  // ==========================================
  // VIEW: LOBBY (Setup & Rules)
  // ==========================================
  if (gameState === "LOBBY") {
    const progress = loadProgress();
    const classicPlayed = progress.classic.totalPlayed;
    const classicWins = progress.classic.totalWins;
    const winRate = classicPlayed > 0 ? Math.round((classicWins / classicPlayed) * 100) : 0;

    return (
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#32171D] sm:text-4xl">
            Classic Timed Sprint
          </h1>
          <p className="mx-auto max-w-lg text-xs sm:text-sm text-[#6B4E55] leading-relaxed">
            Words keep coming one after another! Choose your challenge tier and time limit. Solve as
            many word flips as you can before the clock runs out.
          </p>
        </div>

        {/* Stats strip */}
        <div className="flex items-center justify-center gap-6 rounded-2xl border border-[#C49A6C]/40 bg-[#faeee0]/70 py-3 px-6 text-xs text-[#6B4E55]">
          <div>
            <span className="font-extrabold text-[#32171D]">{classicWins}</span> Wins
          </div>
          <span className="text-[#C49A6C]">•</span>
          <div>
            <span className="font-extrabold text-[#32171D]">{classicPlayed}</span> Solved
          </div>
          <span className="text-[#C49A6C]">•</span>
          <div>
            <span className="font-extrabold text-[#32171D]">{winRate}%</span> Win Rate
          </div>
        </div>

        {/* Step 1: Select Difficulty */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-[#7B1E2B]">
            Step 1: Choose Difficulty
          </label>
          <DifficultySelector selectedDifficulty={difficulty} onSelectDifficulty={setDifficulty} />
        </div>

        {/* Step 2: Select Duration */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-[#7B1E2B]">
            Step 2: Choose Sprint Time Limit
          </label>
          <ClassicDurationSelector
            selectedDuration={durationSeconds}
            onSelectDuration={setDurationSeconds}
          />
        </div>

        {/* Rules Card */}
        <div className="rounded-2xl border border-[#C49A6C]/40 bg-white/90 p-4 text-xs text-[#6B4E55] space-y-2">
          <span className="font-bold uppercase tracking-wider text-[#32171D]">Sprint Rules</span>
          <ul className="list-disc list-inside space-y-1 text-[#6B4E55]">
            <li>Words keep coming non-stop until the sprint timer reaches 0.</li>
            <li>
              Any of the 4 combinations are possible: <strong>Synonym-Antonym</strong>,{" "}
              <strong>Antonym-Synonym</strong>, <strong>Synonym-Synonym</strong>, or{" "}
              <strong>Antonym-Antonym</strong>.
            </li>
            <li>Points accumulate with every solved word based on speed and accuracy.</li>
            <li>Stuck on a tricky word? Use the <strong>Skip</strong> button to keep your momentum going!</li>
          </ul>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-coral-200 bg-coral-50 p-3 text-center text-xs font-semibold text-coral-800">
            {errorMsg}
          </div>
        )}

        {/* Start Button */}
        <button
          type="button"
          data-testid="start-game-button"
          onClick={handleStartSprint}
          disabled={loadingNext}
          className="flex w-full items-center justify-center rounded-full bg-[#7B1E2B] py-3.5 text-base font-extrabold text-[#F7F0E5] shadow-lg transition-all duration-200 ease-out hover:bg-[#631722] hover:shadow-xl active:scale-[0.97] disabled:opacity-50 cursor-pointer"
        >
          {loadingNext ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <span>Start {durationSeconds / 60}-Minute Sprint</span>
          )}
        </button>
      </div>
    );
  }

  // ==========================================
  // VIEW: FINISHED (Summary Screen)
  // ==========================================
  if (gameState === "FINISHED") {
    return (
      <div
        role="region"
        aria-label="Sprint Completed Summary"
        className="mx-auto w-full max-w-xl rounded-3xl border border-[#C49A6C] bg-white/95 p-6 shadow-xl backdrop-blur-sm sm:p-8"
      >
        <div className="flex flex-col items-center text-center">
          <span className="rounded-full bg-[#C49A6C] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#32171D]">
            Sprint Finished!
          </span>

          <h2 className="mt-3 text-3xl font-extrabold text-[#32171D]">
            {solvedList.length} {solvedList.length === 1 ? "Puzzle" : "Puzzles"} Solved
          </h2>
          <p className="mt-1 text-xs text-[#6B4E55]">
            {difficulty} Tier • {durationSeconds / 60} Minutes Duration
          </p>

          {/* Stats Cards */}
          <div className="mt-6 grid w-full grid-cols-2 gap-3">
            <div className="rounded-2xl border border-[#C49A6C]/40 bg-[#faeee0]/60 p-4">
              <div className="text-xs font-bold uppercase text-[#8C6870]">
                Total Score
              </div>
              <p className="mt-1 text-3xl font-black text-[#7B1E2B]">{totalScore}</p>
            </div>

            <div className="rounded-2xl border border-[#C49A6C]/40 bg-[#faeee0]/60 p-4">
              <div className="text-xs font-bold uppercase text-[#8C6870]">
                Words Solved
              </div>
              <p className="mt-1 text-3xl font-black text-[#32171D]">{solvedList.length}</p>
            </div>
          </div>

          {/* Solved Words List */}
          {solvedList.length > 0 && (
            <div className="mt-6 w-full rounded-2xl border border-[#C49A6C]/40 bg-[#faeee0]/30 p-4 text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6870]">
                Words Solved During Sprint
              </span>
              <div className="mt-3 max-h-56 space-y-2.5 overflow-y-auto pr-1">
                {solvedList.map((item, idx) => (
                  <div
                    key={`solved-${idx}`}
                    className="flex items-center justify-between rounded-xl bg-white p-3 border border-[#C49A6C]/30 shadow-2xs"
                  >
                    <div>
                      <span className="font-extrabold text-[#32171D] text-sm">
                        {item.solvedPhrase}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-[#8C6D68]">
                        <span>{item.clueWords[0]}</span>
                        <span>+</span>
                        <span>{item.clueWords[1]}</span>
                        <span>•</span>
                        <span>{item.elapsedSeconds}s</span>
                      </div>
                    </div>
                    <span className="rounded-full bg-[#faeee0] px-2.5 py-1 text-xs font-extrabold text-[#7B1E2B]">
                      +{item.score} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Share sprint results */}
          <div className="mt-5 w-full flex justify-center">
            <ShareButton
              options={{
                mode: "CLASSIC",
                isWon: solvedList.length > 0,
                score: totalScore,
                elapsedSeconds: durationSeconds,
                hintsUsed: solvedList.reduce((acc, i) => acc + i.hintsUsed, 0),
                sprintPuzzlesSolved: solvedList.length,
              }}
            />
          </div>

          {/* Clerk Account Sync for Guest Players */}
          <Show when="signed-out">
            <div className="mt-5 w-full rounded-2xl border border-[#C49A6C] bg-[#faeee0]/70 p-4 text-center">
              <div className="text-xs font-bold text-[#7B1E2B] uppercase tracking-wider">
                Save Your Sprint Record
              </div>
              <p className="mt-1 text-xs text-[#6B4E55]">
                Create a free account to track your sprint scores and compete with friends!
              </p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <SignUpButton mode="modal">
                  <button
                    type="button"
                    className="rounded-full bg-[#7B1E2B] px-4 py-2 text-xs font-bold text-[#F7F0E5] shadow-xs transition-all duration-200 ease-out hover:bg-[#631722] active:scale-[0.97]"
                  >
                    Create Free Account
                  </button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="rounded-full border border-[#C49A6C] bg-white px-3.5 py-2 text-xs font-semibold text-[#32171D] shadow-2xs transition-all duration-200 ease-out hover:bg-[#faeee0] active:scale-[0.97]"
                  >
                    Log In
                  </button>
                </SignInButton>
              </div>
            </div>
          </Show>

          <Show when="signed-in">
            <div className="mt-4 text-xs font-semibold text-[#7B1E2B]">
              Sprint record saved to your account
            </div>
          </Show>

          {/* Actions */}
          <div className="mt-6 flex w-full flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={handleStartSprint}
              className="inline-flex flex-1 items-center justify-center rounded-full bg-[#7B1E2B] px-5 py-3 text-sm font-bold text-[#F7F0E5] shadow-md transition-all duration-200 ease-out hover:bg-[#631722] hover:shadow-lg active:scale-[0.97]"
            >
              Play Again ({durationSeconds / 60}m)
            </button>
            <button
              type="button"
              onClick={() => setGameState("LOBBY")}
              className="inline-flex items-center justify-center rounded-full border border-[#C49A6C] bg-white px-5 py-3 text-sm font-semibold text-[#32171D] shadow-sm transition-all duration-200 ease-out hover:bg-[#faeee0] active:scale-[0.97]"
            >
              Change Settings
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-[#C49A6C] bg-white px-5 py-3 text-sm font-semibold text-[#32171D] shadow-sm transition-all duration-200 ease-out hover:bg-[#faeee0] active:scale-[0.97]"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: PLAYING (Active Sprint Game Board)
  // ==========================================
  const formattedSprintTime = formatTime(sprintTimeRemaining);
  const urgency = getTimerUrgency(sprintTimeRemaining);

  return (
    <div className="flex w-full flex-col items-center gap-4 sm:gap-5">
      {/* Mobile Floating Sticky Header Timer — stays visible throughout active sprint on mobile */}
      {gameState === "PLAYING" && (
        <div
          data-testid="classic-mobile-sticky-timer"
          className="fixed top-2.5 left-1/2 -translate-x-1/2 z-50 sm:hidden pointer-events-none"
        >
          <div
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black tabular-nums font-mono shadow-md backdrop-blur-md transition-all duration-200 ${
              urgency === "critical"
                ? "border-[#7B1E2B] bg-[#7B1E2B] text-[#F7F0E5] animate-pulse shadow-red-200"
                : urgency === "urgent"
                  ? "border-amber-300 bg-amber-100 text-amber-900"
                  : "border-[#C49A6C] bg-white/95 text-[#32171D]"
            }`}
          >
            <span className="font-mono text-xs font-black tracking-wider">
              ⏱ {formattedSprintTime}
            </span>
          </div>
        </div>
      )}

      {/* Persistent Sprint HUD */}
      <div
        data-testid="game-hud"
        className="flex w-full max-w-2xl items-center justify-between rounded-2xl border border-[#C49A6C] bg-white/95 px-4 py-3 shadow-md backdrop-blur-sm sm:px-6"
      >
        {/* Score & Solved Counter & Status */}
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="inline-flex rounded-full bg-[#faeee0] border border-[#C49A6C]/40 px-2 py-0.5 text-[10px] font-bold text-[#7B1E2B] uppercase">
            Round Active
          </span>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6870]">
              Score
            </span>
            <span className="text-xl sm:text-2xl font-black text-[#7B1E2B]">{totalScore}</span>
          </div>
          <div className="h-8 w-px bg-[#C49A6C]/30" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6870]">
              Solved
            </span>
            <span className="text-xl sm:text-2xl font-black text-[#32171D]">
              {solvedList.length}
            </span>
          </div>
          <div className="h-8 w-px bg-[#C49A6C]/30" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C6870]">
              Hints:
            </span>
            <span className="text-sm font-black text-[#32171D]">{currentHintsUsed}</span>
          </div>
        </div>

        {/* Global Sprint Countdown */}
        <div
          className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 border font-mono text-xl sm:text-2xl font-black ${
            urgency === "critical"
              ? "bg-[#7B1E2B] text-[#F7F0E5] border-[#7B1E2B] animate-pulse"
              : urgency === "urgent"
                ? "bg-amber-100 text-amber-900 border-amber-300"
                : "bg-[#faeee0] text-[#32171D] border-[#C49A6C]"
          }`}
        >
          <span>{formattedSprintTime}</span>
        </div>

        {/* Skip button */}
        <button
          type="button"
          onClick={handleSkipPuzzle}
          disabled={loadingNext}
          className="inline-flex items-center justify-center rounded-full border border-[#C49A6C]/50 bg-[#faeee0]/70 px-4 py-1.5 text-xs font-bold text-[#32171D] hover:bg-[#faeee0] hover:border-[#7B1E2B] transition-all duration-200 ease-out active:scale-[0.97] cursor-pointer disabled:opacity-50"
          title="Skip this puzzle"
        >
          Skip
        </button>
      </div>

      {/* Celebration Toast */}
      {celebrationToast && (
        <div
          role="status"
          className="w-full max-w-lg rounded-xl border border-[#C49A6C] bg-[#faeee0] px-4 py-2.5 text-center text-xs sm:text-sm font-extrabold text-[#7B1E2B] shadow-sm animate-bounce"
        >
          {celebrationToast}
        </div>
      )}

      {/* Current Puzzle Display */}
      {loadingNext ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7B1E2B] border-t-transparent" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-[#6B4E55]">
            Loading Next Word...
          </p>
        </div>
      ) : currentPayload && grid ? (
        <div className="flex w-full flex-col items-center gap-5">
          {/* Clue Words Card */}
          <div className="flex w-full max-w-lg flex-col items-center rounded-2xl border border-[#C49A6C]/50 bg-white/80 p-4 text-center shadow-xs">
            <div className="flex w-full items-center justify-between px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6870]">
                Clue Words to Flip
              </span>

              {/* Mobile In-Card Live Timer — visible directly above grid when keyboard opens */}
              <div
                data-testid="classic-card-mobile-timer"
                className={`sm:hidden inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-black tabular-nums font-mono shadow-2xs transition-colors duration-200 ${
                  urgency === "critical"
                    ? "border-[#7B1E2B] bg-[#faeee0] text-[#7B1E2B] animate-pulse"
                    : urgency === "urgent"
                      ? "border-amber-300 bg-amber-50 text-amber-900"
                      : "border-[#C49A6C]/60 bg-[#faeee0] text-[#32171D]"
                }`}
                aria-label={`Time remaining: ${formattedSprintTime}`}
              >
                <span className="font-mono text-xs font-black tracking-wider">
                  Timer: {formattedSprintTime}
                </span>
              </div>
            </div>
            <div className="mt-1 flex items-center gap-3 text-xl sm:text-2xl font-black text-[#32171D]">
              <span className="rounded-lg bg-[#faeee0] px-3 py-1 text-[#7B1E2B]">
                {currentPayload.clueWords[0]}
              </span>
              <span className="text-[#C49A6C]">+</span>
              <span className="rounded-lg bg-[#faeee0] px-3 py-1 text-[#7B1E2B]">
                {currentPayload.clueWords[1]}
              </span>
            </div>
            <span className="mt-2 text-[11px] text-[#8C6D68]">
              Guess the familiar phrase ({currentPayload.wordLengths[0]} and {currentPayload.wordLengths[1]} letters)
            </span>
          </div>

          {/* Letter Grid */}
          <section className="w-full" aria-label="Interactive Letter Grid">
            <LetterGrid
              grid={grid}
              selectedPosition={selectedPosition}
              isRoundOver={false}
              onSelectTile={handleSelectTile}
              onInputLetter={handleInputLetter}
              onClearTile={handleClearTile}
              onNavigate={handleNavigate}
              onEnter={handleSubmitCurrentBoard}
            />
          </section>

          {/* Manual Submit Button & Enter Hint */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={handleSubmitCurrentBoard}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#7B1E2B] px-8 py-2.5 text-sm sm:text-base font-extrabold text-[#F7F0E5] shadow-md hover:bg-[#631722] active:scale-[0.97] transition-all duration-200 ease-out disabled:opacity-50 border border-[#C49A6C]/40 cursor-pointer"
            >
              {isSubmitting ? "Verifying..." : "Check Answer"}
            </button>
            <span className="text-[11px] font-semibold text-[#8C6870]">
              Or press <kbd className="rounded border border-[#C49A6C]/50 bg-[#faeee0] px-1 py-0.5 text-[10px] font-bold text-[#32171D]">Enter</kbd>
            </span>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div
              role="alert"
              className="rounded-xl border border-coral-200 bg-coral-50 px-4 py-2 text-center text-xs font-semibold text-coral-800"
            >
              {errorMsg}
            </div>
          )}

          {/* Hint Control */}
          <div className="flex items-center gap-3">
            <HintControl
              hintsUsed={currentHintsUsed}
              isRoundOver={false}
              onUseHint={handleUseHint}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
