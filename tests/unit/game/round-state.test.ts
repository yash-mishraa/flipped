import { describe, it, expect } from "vitest";
import {
  applyHintToRound,
  applyLetterInput,
  applyTileClear,
  createInitialRoundState,
  resetRound,
  selectTile,
  startRound,
  tickTimer,
  timeOutRound,
} from "@/features/game/domain/round-state";
import { TEST_PUZZLES } from "@/features/game/data/test-puzzles";
import type { RoundState } from "@/features/game/domain/types";

describe("Round State Lifecycle & Auto-Win Detection", () => {
  const fastFoodPuzzle = TEST_PUZZLES[0]!; // FAST (4) FOOD (4)

  it("creates initial round in READY status with 100 score and first editable tile selected", () => {
    const round = createInitialRoundState(fastFoodPuzzle);

    expect(round.status).toBe("READY");
    expect(round.hintsUsed).toBe(0);
    expect(round.elapsedSeconds).toBe(0);
    expect(round.score).toBe(100);
    expect(round.selectedTilePosition).toEqual({ wordIndex: 0, letterIndex: 1 });
    expect(round.lastValidationResult).toBeNull();
  });

  it("transitions from READY to PLAYING via startRound", () => {
    const ready = createInitialRoundState(fastFoodPuzzle);
    const playing = startRound(ready);

    expect(playing.status).toBe("PLAYING");
    expect(playing.score).toBe(100);

    // Idempotent when already playing
    const same = startRound(playing);
    expect(same).toBe(playing);
  });

  it("automatically starts the round when typing a letter in READY state", () => {
    const ready = createInitialRoundState(fastFoodPuzzle);
    const updated = applyLetterInput(ready, { wordIndex: 0, letterIndex: 1 }, "A");

    expect(updated.status).toBe("PLAYING");
    expect(updated.grid.words[0][1]?.letter).toBe("A");
    expect(updated.grid.words[0][1]?.feedback).toBe("CONFIRMED");
    // Cursor advances to next editable tile (0, 2)
    expect(updated.selectedTilePosition).toEqual({ wordIndex: 0, letterIndex: 2 });
  });

  it("automatically detects full correct answer and transitions to WON state", () => {
    let state: RoundState = createInitialRoundState(fastFoodPuzzle);
    state = startRound(state);

    // Word 0: F is fixed. Enter A, S, T
    state = applyLetterInput(state, { wordIndex: 0, letterIndex: 1 }, "A");
    state = applyLetterInput(state, { wordIndex: 0, letterIndex: 2 }, "S");
    state = applyLetterInput(state, { wordIndex: 0, letterIndex: 3 }, "T");

    // Word 1: F is fixed. Enter O, O, D
    state = applyLetterInput(state, { wordIndex: 1, letterIndex: 1 }, "O");
    state = applyLetterInput(state, { wordIndex: 1, letterIndex: 2 }, "O");

    // Before final letter, still PLAYING
    expect(state.status).toBe("PLAYING");

    // Enter final letter 'D'
    const finalState = applyLetterInput(state, { wordIndex: 1, letterIndex: 3 }, "D");

    // Must trigger WON immediately without manual submit
    expect(finalState.status).toBe("WON");
    if (finalState.status === "WON") {
      expect(finalState.selectedTilePosition).toBeNull();
      expect(finalState.terminalResult.status).toBe("WON");
      expect(finalState.terminalResult.finalScore).toBe(100);
      expect(finalState.terminalResult.solvedPhrase).toBe("FAST FOOD");
      expect(finalState.lastValidationResult.isMatch).toBe(true);
    }
  });

  it("transitions to TIMED_OUT when time expires and freezes score", () => {
    let state: RoundState = createInitialRoundState(fastFoodPuzzle);
    state = startRound(state);
    state = tickTimer(state, 50); // 50 seconds: 100 - 10 = 90

    const timedOut = timeOutRound(state);
    expect(timedOut.status).toBe("TIMED_OUT");
    expect(timedOut.score).toBe(90);
    expect(timedOut.selectedTilePosition).toBeNull();
    expect(timedOut.terminalResult.status).toBe("TIMED_OUT");
    expect(timedOut.terminalResult.finalScore).toBe(90);

    // Cannot time out a round that was already won
    const wonRound = {
      ...state,
      status: "WON" as const,
      terminalResult: {
        status: "WON" as const,
        finalScore: 100,
        elapsedSeconds: 0,
        hintsUsed: 0,
        completedAt: new Date().toISOString(),
      },
    };
    expect(() => timeOutRound(wonRound as unknown as RoundState)).toThrowError(/already won/);
  });

  it("strictly prohibits restarting or mutating a terminal round", () => {
    let state: RoundState = createInitialRoundState(fastFoodPuzzle);
    state = startRound(state);
    const timedOut = timeOutRound(state);

    // Calling startRound on terminal state throws error
    expect(() => startRound(timedOut)).toThrowError(/Cannot start a round that has already ended/);

    // Entering letter or clearing tile in terminal state returns state unchanged
    const afterInput = applyLetterInput(timedOut, { wordIndex: 0, letterIndex: 1 }, "A");
    expect(afterInput).toBe(timedOut);

    const afterClear = applyTileClear(timedOut, { wordIndex: 0, letterIndex: 1 });
    expect(afterClear).toBe(timedOut);

    // Timer tick in terminal state is ignored
    const afterTick = tickTimer(timedOut, 999);
    expect(afterTick).toBe(timedOut);
  });

  it("updates score dynamically as timer ticks during active gameplay", () => {
    let state: RoundState = createInitialRoundState(fastFoodPuzzle);
    state = startRound(state);

    // 0s -> 100
    expect(state.score).toBe(100);

    // 15s -> 100 - floor(15/5) = 97
    state = tickTimer(state, 15);
    expect(state.score).toBe(97);

    // 30s -> 100 - floor(30/5) = 94
    state = tickTimer(state, 30);
    expect(state.score).toBe(94);
  });

  it("does not tick timer if round is still in READY status", () => {
    const ready = createInitialRoundState(fastFoodPuzzle);
    const ticked = tickTimer(ready, 30);

    expect(ticked.elapsedSeconds).toBe(0);
    expect(ticked.score).toBe(100);
  });

  it("applies a hint to the active round, deducting 5 points", () => {
    let state: RoundState = createInitialRoundState(fastFoodPuzzle);
    state = startRound(state);
    expect(state.score).toBe(100);

    // First hint fills tile (0, 1) with 'A'
    state = applyHintToRound(state);
    expect(state.hintsUsed).toBe(1);
    expect(state.score).toBe(95);
    expect(state.grid.words[0][1]?.letter).toBe("A");
    expect(state.grid.words[0][1]?.feedback).toBe("CONFIRMED");
  });

  it("triggers win immediately if a hint solves the final remaining letter", () => {
    let state: RoundState = createInitialRoundState(fastFoodPuzzle);
    state = startRound(state);

    // Fill all letters except final letter (1, 3) 'D'
    state = applyLetterInput(state, { wordIndex: 0, letterIndex: 1 }, "A");
    state = applyLetterInput(state, { wordIndex: 0, letterIndex: 2 }, "S");
    state = applyLetterInput(state, { wordIndex: 0, letterIndex: 3 }, "T");
    state = applyLetterInput(state, { wordIndex: 1, letterIndex: 1 }, "O");
    state = applyLetterInput(state, { wordIndex: 1, letterIndex: 2 }, "O");

    expect(state.status).toBe("PLAYING");

    // Apply hint for the last remaining letter
    const wonState = applyHintToRound(state);
    expect(wonState.status).toBe("WON");
    if (wonState.status === "WON") {
      expect(wonState.hintsUsed).toBe(1);
      expect(wonState.score).toBe(95); // 100 - 5 for the hint
      expect(wonState.terminalResult.finalScore).toBe(95);
    }
  });

  it("clears a tile and re-evaluates answer status cleanly", () => {
    let state: RoundState = createInitialRoundState(fastFoodPuzzle);
    state = applyLetterInput(state, { wordIndex: 0, letterIndex: 1 }, "A");
    expect(state.grid.words[0][1]?.letter).toBe("A");

    state = applyTileClear(state, { wordIndex: 0, letterIndex: 1 });
    expect(state.grid.words[0][1]?.letter).toBe("");
    expect(state.lastValidationResult?.status).toBe("INCOMPLETE");
  });

  it("resets a round back to fresh READY state", () => {
    let state: RoundState = createInitialRoundState(fastFoodPuzzle);
    state = applyLetterInput(state, { wordIndex: 0, letterIndex: 1 }, "A");
    state = tickTimer(state, 20);
    expect(state.status).toBe("PLAYING");

    const fresh = resetRound(fastFoodPuzzle);
    expect(fresh.status).toBe("READY");
    expect(fresh.hintsUsed).toBe(0);
    expect(fresh.elapsedSeconds).toBe(0);
    expect(fresh.score).toBe(100);
    expect(fresh.grid.words[0][1]?.letter).toBe("");
  });

  it("prevents selecting fixed clue tiles", () => {
    const state = createInitialRoundState(fastFoodPuzzle);
    const attemptedSelect = selectTile(state, { wordIndex: 0, letterIndex: 0 }); // Tile (0,0) is fixed 'F'

    // Selection not changed to fixed tile
    expect(attemptedSelect.selectedTilePosition).toEqual({ wordIndex: 0, letterIndex: 1 });
  });
});
