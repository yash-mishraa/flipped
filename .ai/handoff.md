# Flipped — Session Handoff (Part 4 -> Part 5)

## 1. What Exists Today

- **Core Game Engine & Timer Modules (`src/features/game/`)**:
  - `domain/types.ts`: complete domain contracts for `Puzzle`, `LetterTile`, `LetterGrid`, `RoundState` (`READY`, `PLAYING`, `WON`, `TIMED_OUT`), `TerminalResult`, and unique `roundId`.
  - `domain/timer-utils.ts`: pure time formatting (`01:00`), urgency categorization, and deadline calculations.
  - `domain/round-state.ts`: immutable round state machine with unique `roundId` generation and atomic deadline enforcement.
  - `domain/scoring.ts`: deterministic scoring formula.
  - `domain/hints.ts`: deterministic reading-order hint selection.
  - `hooks/useGameTimer.ts`: deadline-based countdown timer with tab visibility synchronization.
  - `hooks/usePuzzleRound.ts`: full round controller tying together grid, timer, hints, auto-win, and timeout.

- **UI & Presentation Components (`src/features/game/components/`)**:
  - `GameTimer.tsx`: countdown display with multi-stage urgency styling (`normal`, `urgent`, `critical` with pulse, `expired`).
  - `GameHUD.tsx`: top status bar, timer, live score, hint counter, and prominent "Start Game (60s)" CTA.
  - `SuccessScreen.tsx`: victory summary with solved phrase, transformation explanations, score, elapsed time, hints, and Play Again.
  - `TimeoutScreen.tsx`: encouraging timeout summary with canonical answer reveal, practice score distinction, and Play Again.
  - `GameBoard.tsx`: composite game board supporting untimed / timed modes and result flows.
  - `src/app/play/page.tsx`: development gameplay sandbox route with fixture switching and 60-second timer.

- **Verification Metrics**:
  - **121 / 121 unit and component tests passing** across 13 test suites in ~1.3s (`npm run test`).
  - Zero TypeScript compiler errors (`npm run typecheck`).
  - Zero ESLint errors or warnings (`npm run lint`).
  - Clean Prettier formatting (`npm run format:check`).
  - Successful Next.js production build with static prerendering (`npm run build`).

---

## 2. What Part 5 Must Implement

In **Part 5 — Game Modes (Daily & Classic), Scheduling & State Persistence**, the engineer will build the official game modes, daily calendar scheduling, and local persistence:

1. **Daily Mode Implementation**:
   - Deterministic calendar-based puzzle selector tied to UTC midnight.
   - Generates or selects the canonical daily puzzle for any given UTC date (`YYYY-MM-DD`).
   - Guarantees all players worldwide receive the identical challenge on the same date.
   - Daily attempt locking: prevents multiple daily attempts on the same calendar day.

2. **Classic Mode Implementation**:
   - Endless procedural or bank-based puzzle progression.
   - Selectable difficulty tiers (`EASY`, `MEDIUM`, `HARD`).
   - Unlimited replayability without calendar restrictions.

3. **Client-Side State Persistence (LocalStorage)**:
   - Serialized state snapshots saved to LocalStorage on every action.
   - Restoration of in-progress games on browser reload.
   - Safe migration and corruption recovery (graceful fallback to fresh state).
   - Tracking daily completion status across browser sessions.
