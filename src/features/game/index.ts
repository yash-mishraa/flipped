/**
 * Game feature module public API.
 * Exports pure domain logic, scoring, timer, puzzle validation, interactive UI components,
 * daily scheduling, classic mode selection, persistence, and test datasets.
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
export * from "./domain/timer-utils";
export * from "./data/test-puzzles";
export * from "./data/puzzles";
export * from "./data/daily-schedule";

// Game Modes & Scheduling
export * from "./modes/mode-types";
export * from "./modes/daily-scheduler";
export * from "./modes/classic-selector";
export * from "./modes/round-configuration";

// Local Persistence Adapter
export * from "./persistence/local-progress";

// Interactive React components and hooks
export { GameBoard } from "./components/GameBoard";
export { ServerGameBoard } from "./components/ServerGameBoard";
export { GameHUD } from "./components/GameHUD";
export { GameTimer } from "./components/GameTimer";
export { SuccessScreen } from "./components/SuccessScreen";
export { TimeoutScreen } from "./components/TimeoutScreen";
export { HintControl } from "./components/HintControl";
export { GameFeedback } from "./components/GameFeedback";
export { GameInstructions } from "./components/GameInstructions";
export { DifficultySelector } from "./components/DifficultySelector";
export { DailyCompletionCard } from "./components/DailyCompletionCard";
export { LetterTile as LetterTileUI } from "./components/LetterTile";
export { LetterGrid as LetterGridUI } from "./components/LetterGrid";
export { usePuzzleRound } from "./hooks/usePuzzleRound";
export { useGameTimer } from "./hooks/useGameTimer";
