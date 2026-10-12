/**
 * Game feature module public API.
 * Exports pure domain logic, scoring, puzzle validation, interactive UI components, and test datasets.
 */

export * from "./constants";
export * from "./domain/types";
export * from "./domain/normalize-answer";
export * from "./domain/validate-puzzle";
export * from "./domain/check-answer";
export * from "./domain/evaluate-letters";
export * from "./domain/letter-grid";
export * from "./domain/scoring";
export * from "./domain/hints";
export * from "./domain/round-state";
export * from "./data/test-puzzles";

// Interactive React components and hooks
export { GameBoard } from "./components/GameBoard";
export { HintControl } from "./components/HintControl";
export { GameFeedback } from "./components/GameFeedback";
export { GameInstructions } from "./components/GameInstructions";
export { LetterTile as LetterTileUI } from "./components/LetterTile";
export { LetterGrid as LetterGridUI } from "./components/LetterGrid";
export { usePuzzleRound } from "./hooks/usePuzzleRound";
