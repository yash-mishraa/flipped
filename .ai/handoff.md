# Flipped — Session Handoff (Part 3 -> Part 4)

## 1. What Exists Today

- **Core Game Engine (`src/features/game/domain/`)**:
  - `types.ts`: complete domain contracts for `Puzzle`, `LetterTile`, `LetterGrid`, `RoundState`, `AnswerCheckResult`, `TileFeedback`, `TilePosition`, `TerminalResult`.
  - `normalize-answer.ts`: normalization and equivalence evaluation.
  - `validate-puzzle.ts`: puzzle validation and collection verification.
  - `check-answer.ts`: answer checking against canonical phrase and variants.
  - `evaluate-letters.ts`: two-pass frequency-aware elimination algorithm.
  - `letter-grid.ts`: grid initialization, editing, navigation helpers.
  - `scoring.ts`: deterministic scoring with time and hint penalties.
  - `hints.ts`: deterministic reading-order hint selection and application.
  - `round-state.ts`: immutable round state machine with automatic win detection.
  - `src/features/game/data/test-puzzles.ts`: 12 verified test fixtures.

- **Interactive UI Components & Hooks (`src/features/game/`)**:
  - `components/LetterTile.tsx`: multi-modal accessible letter tile with color, border, badge, and text decoration feedback.
  - `components/LetterGrid.tsx`: interactive grid with hardware keyboard capture, touch buffer input, and roving index.
  - `components/GameBoard.tsx`: clue cards, grid, hint control, feedback banner, and instructions.
  - `components/HintControl.tsx`: hint trigger with scoring penalty banner.
  - `components/GameFeedback.tsx`: live round indicators and victory celebration card.
  - `components/GameInstructions.tsx`: collapsible rule guide and feedback legend.
  - `hooks/usePuzzleRound.ts`: React state wrapper orchestrating round lifecycle and automatic win triggers.
  - `src/app/play/page.tsx`: development sandbox route for manual and automated verification.

- **Verification Metrics**:
  - 106 unit tests passing across 11 test suites in ~1s (`npm run test`).
  - Zero TypeScript compiler errors (`npm run typecheck`).
  - Zero ESLint errors or warnings (`npm run lint`).
  - Clean Prettier formatting (`npm run format:check`).
  - Successful Next.js production build (`npm run build`).

---

## 2. What Part 4 Must Implement

In **Part 4 — Game Modes & Client-Side State Persistence**, the engineer will build the production mode lifecycle, countdown timer, and local persistence:

1. **Production 60-Second Countdown Timer**:
   - Live 60-second countdown ticking every 1 second during active play.
   - Dynamic real-time score updates reflecting the 1-point penalty per 5 elapsed seconds.
   - Timeout transition to `TIMED_OUT` when timer reaches 0:
     - Freezes score at 0.
     - Reveals the full solution phrase.
     - Displays completion summary card with retry options.

2. **Daily Mode**:
   - Deterministic calendar-based puzzle selector tied to UTC midnight.
   - Guarantees all players worldwide receive the identical puzzle on any given UTC date.
   - One attempt per day lock / completion persistence.

3. **Classic Mode**:
   - Replayable endless mode with puzzle progression or random selection from the puzzle bank.
   - Difficulty selection or progressive difficulty escalation.

4. **Client-Side State Persistence (LocalStorage)**:
   - Serialized state snapshots saved to LocalStorage on every action.
   - Restoration of in-progress games on page refresh or browser re-entry.
   - Safe migration and corruption recovery (gracefully fall back to fresh state if stored snapshot is corrupted or stale).
