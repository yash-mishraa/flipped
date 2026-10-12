# Flipped — Project Progress & Verification Record

## 1. Current Project Status

- **Current Stage**: Part 4 (60-Second Gameplay Loop, Timer, Scoring & Results)
- **Status**: **Completed & Fully Verified**
- **Date**: 2026-10-12
- **Repository State**: Clean git repository, zero unmanaged files, zero lint warnings/errors, 121/121 unit tests passing.

---

## 2. Completed Work Across Stages

### Stage 1 (Foundation & Shell) — Completed

- Initialized Next.js 15 App Router, React 19, TypeScript strict mode, Tailwind CSS v4, Lucide icons.
- Configured ESLint 9, Prettier 3, Vitest 3 with jsdom, Playwright config.
- Established clean architecture and minimal shell displaying title `Flipped` and mode cards.
- Created living documentation suite in `.ai/`.

### Stage 2 (Pure Game Engine & Puzzle Logic) — Completed

1. **Domain Models & Types (`src/features/game/domain/types.ts`)**:
   - Strongly typed `Puzzle` schema with `clueWords`, `answerWords`, `WordTransformation` (`SYNONYM` | `ANTONYM`), `Difficulty` (`EASY` | `MEDIUM` | `HARD`), and `approvedVariants`.
   - Discriminated union for `RoundState`: `READY`, `PLAYING`, `WON`, `TIMED_OUT`.
   - Immutable `LetterTile` models with explicit feedback states: `FIXED`, `CONFIRMED`, `PENDING`, `ELIMINATED`, `NONE`.
   - Terminal results with frozen score, elapsed seconds, and completed timestamp.

2. **Answer Normalization (`src/features/game/domain/normalize-answer.ts`)**:
   - `normalizeWord`: trims, uppercases, strips non-alphabetical characters.
   - `normalizeAnswerPhrase`: normalizes casing, collapses whitespace, converts hyphens/underscores to spaces, strips unsupported punctuation.
   - `normalizeAnswerPair`: builds canonical two-word phrase representation.
   - `splitNormalizedPhrase`: parses two-word phrases into strictly typed tuples.
   - `areAnswersEquivalent`: semantic equivalence comparator.

3. **Semantic Puzzle Validator (`src/features/game/domain/validate-puzzle.ts`)**:
   - Validates required fields, non-empty clue/answer pairs, relationship types, descriptive explanations, and difficulty levels.
   - Verifies approved variants are valid two-word phrases without duplicates or canonical duplication.
   - `validatePuzzleCollection`: verifies collections and flags duplicate puzzle IDs.

4. **Exact Answer Checking (`src/features/game/domain/check-answer.ts`)**:
   - `checkAnswer` and `checkGridAnswer`: evaluates canonical match and approved variants.
   - Returns structured `AnswerCheckResult` (`CORRECT`, `INCOMPLETE`, `INCORRECT`) without leaking solutions in user-facing messages.
   - Prevents substring false positives and requires correct word order.

5. **Letter Elimination & Evaluation Algorithm (`src/features/game/domain/evaluate-letters.ts`)**:
   - Two-pass frequency-aware algorithm:
     - Pass 1: Fixed tiles and exact position matches marked `CONFIRMED`.
     - Pass 2: Tiles in wrong positions with remaining target frequency marked `PENDING` (never prematurely eliminated). Excess tiles or letters not in target marked `ELIMINATED`.
   - Preserves player's ability to edit and replace incorrect tiles.

6. **Framework-Independent Letter Grid Engine (`src/features/game/domain/letter-grid.ts`)**:
   - `createInitialGrid`: reveals first letter of both answer words as `FIXED`, sets remaining tiles empty and editable.
   - `enterLetter`, `clearTile`: pure, immutable operations that strictly reject edits to fixed tiles.
   - `getNextEditablePosition`, `getPreviousEditablePosition`, `getFirstEditablePosition`: reading-order grid navigation.
   - `getWordString`, `getPhraseString`, `isGridFilled`: string extraction and grid completeness inspection.

7. **Deterministic Scoring Engine (`src/features/game/domain/scoring.ts`)**:
   - `calculateScore(elapsedSeconds, hintsUsed)` implementing $\text{score} = \max(0, \min(100, 100 - \lfloor\text{elapsedSeconds} / 5\rfloor - (\text{hintsUsed} \times 5)))$.
   - Strict validation: rejects negative or non-finite inputs with `RangeError`/`TypeError`.

8. **Deterministic Hint Engine (`src/features/game/domain/hints.ts`)**:
   - `selectNextHint`: reading-order scan (Word 0 left-to-right, then Word 1 left-to-right). Selects first non-fixed, unsolved tile.
   - Never overwrites fixed letters or already correct player entries.
   - Returns `NO_ELIGIBLE_TILES` when grid is fully solved.
   - `applyHintToGrid`: enters revealed letter and confirms tile.

9. **Round State Lifecycle Manager (`src/features/game/domain/round-state.ts`)**:
   - Pure state transitions: `READY` -> `PLAYING` -> `WON` or `TIMED_OUT`.
   - `applyLetterInput`: automatic answer detection transitions immediately to `WON` when puzzle is solved.
   - Enforces terminal immutability: terminal states cannot be reverted, edited, or timed out twice.

10. **Curated Test Puzzle Fixtures (`src/features/game/data/test-puzzles.ts`)**:
    - 12 verified test puzzles including `SLOW + MEAL → FAST FOOD` and `PEACE + LAUGH → WAR CRY`, covering varying word lengths, difficulty tiers, repeated letters, and approved variants.

### Stage 3 (Interactive Letter Grid & Gameplay UI) — Completed

1. **State Orchestration Hook (`src/features/game/hooks/usePuzzleRound.ts`)**:
   - Manages active round lifecycle (`READY` / `PLAYING` / `WON` / `TIMED_OUT`) wrapping pure engine transitions.
   - Automatically initializes cursor to first editable tile (`getNextEditablePosition`).
   - Dispatches inputs, deletions, hints, and roving navigation actions.
   - Reactively triggers automatic win transition upon valid phrase completion.

2. **Accessible Letter Tile Component (`src/features/game/components/LetterTile.tsx`)**:
   - Multi-modal visual feedback for color-vision deficiency accessibility:
     - `FIXED`: locked clue letter with slate styling and `<Lock />` badge.
     - `CONFIRMED`: green background with emerald border and `<Check />` badge.
     - `PENDING`: amber background with amber border and bold text.
     - `ELIMINATED`: dimmed stone background with diagonal `<Slash />` badge and strike-through text.
     - `NONE`: blank slot with subtle border.
   - High-contrast coral focus ring indicating current selection.
   - Fixed tiles render with `aria-disabled="true"` and ignore selection clicks.

3. **Interactive Letter Grid Component (`src/features/game/components/LetterGrid.tsx`)**:
   - Renders word groups with responsive spacing and clean horizontal wrap prevention.
   - Off-screen hidden input buffer capturing virtual keyboard entry on touch devices.
   - Full hardware keyboard interception: `ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`, `Home`, `End`, `Backspace`, `Delete`, and `A-Z`.
   - Automatic cursor advancement to next editable position across word boundaries.
   - Smart backspace handling (clears current tile or steps backward to clear previous tile).

4. **Composite Game Board Container (`src/features/game/components/GameBoard.tsx`)**:
   - Displays transformation clue pair cards (Clue Word, Transformation Badge, Semantic Explanation).
   - Integrates `LetterGrid`, `HintControl`, `GameFeedback`, and `GameInstructions`.

5. **Hint Control Component (`src/features/game/components/HintControl.tsx`)**:
   - Dispatches deterministic next-hint reveal from engine.
   - Displays temporary feedback banner indicating 5-point scoring deduction.
   - Disabled when round is over or when no eligible tiles remain.

6. **Feedback & Summary Component (`src/features/game/components/GameFeedback.tsx`)**:
   - Live round stats: elapsed time indicator, hints used count.
   - Victory celebration card: solved phrase display, final score calculation, elapsed time, and replay action.

7. **Accessible Guidance Drawer (`src/features/game/components/GameInstructions.tsx`)**:
   - Collapsible instructional guide explaining puzzle mechanics, keyboard navigation shortcuts, and multi-modal feedback legend.

8. **Development Gameplay Sandbox (`src/app/play/page.tsx`)**:
   - Live interactive development sandbox accessible via "Launch 60-Second Timed Round" on home screen.
   - Test fixture cycling control allowing immediate testing across all 12 test puzzles.

### Stage 4 (60-Second Gameplay Loop, Timer, Scoring & Results) — Completed

1. **Drift-Free Countdown Timer Hook & Utilities (`src/features/game/hooks/useGameTimer.ts`, `src/features/game/domain/timer-utils.ts`)**:
   - Computes remaining and elapsed time against an authoritative deadline timestamp ($\text{deadline} = \text{startTime} + 60\,000\,\text{ms}$) rather than error-prone accumulator decrements.
   - Listens for `visibilitychange` events; tab throttling is reconciled immediately with zero extra time granted upon tab return.
   - Categorizes urgency states (`normal`, `urgent`, `critical`, `expired`) and formats standard `MM:SS` notation (`01:00` down to `00:00`).

2. **Game Timer Visual Component (`src/features/game/components/GameTimer.tsx`)**:
   - Urgency visual cues: neutral badge (> 20s), warm amber alert (11–20s), coral alert with restrained pulse animation (1–10s, respecting `prefers-reduced-motion`), and muted expired state (0s).
   - High-contrast typography with monospace tabular figures and accessible `role="timer"` / `aria-live`.

3. **Live Gameplay Heads-Up Display (`src/features/game/components/GameHUD.tsx`)**:
   - Status badge (`Ready to Play`, `Round Active`, `Solved`, `Time Expired`), live score, hints used count, and reset button.
   - Prominent "Start Game (60s)" call-to-action button when in `READY` state.
   - Clue transformation cards showing clue words, transformation types, and semantic context.

4. **Irreversible Round Lifecycle & Atomic Race Prevention (`src/features/game/hooks/usePuzzleRound.ts`)**:
   - Strict `READY -> PLAYING -> WON` / `TIMED_OUT` state transitions.
   - Editable tiles are locked in `READY` until explicit start button click.
   - Authoritative deadline validation: letter entries or hints processed at or after the deadline atomically trigger `TIMED_OUT` rather than `WON`.
   - Stops the timer immediately when the round ends and freezes final score.

5. **Celebratory Victory Screen (`src/features/game/components/SuccessScreen.tsx`)**:
   - Solved answer phrase display, full semantic transformation explanations, frozen final score, elapsed seconds, hints used count.
   - "Play Again" button and "Home" navigation link.

6. **Encouraging Timeout Screen (`src/features/game/components/TimeoutScreen.tsx`)**:
   - Encouraging time-expired message, revealed canonical solution phrase, semantic transformations breakdown.
   - Clear distinction between official solve score (**0**) and practice potential score metric.
   - "Play Again" button and "Home" navigation link.

7. **Clean Replay & Reset Architecture (`resetRound`, `generateRoundId`)**:
   - Play Again creates a genuinely fresh round with unique `roundId`.
   - Restores initial fixed clue letters, resets timer to 60s, hints to 0, score to 100, and cleans up old callbacks.

---

## 3. Verification Results

Every development script was executed and verified directly:

| Step / Command         | Target / Operation                      | Execution Result                                          | Exit Status   |
| :--------------------- | :-------------------------------------- | :-------------------------------------------------------- | :------------ |
| `npm run typecheck`    | TypeScript compiler (`tsc --noEmit`)    | Checked all files, zero type errors                       | `0` (Success) |
| `npm run lint`         | ESLint 9 analysis (`eslint .`)          | Analyzed all files, zero errors, zero warnings            | `0` (Success) |
| `npm run format:check` | Prettier check across code & markdown   | All files formatted cleanly                               | `0` (Success) |
| `npm run test`         | Vitest unit test suite (13 test suites) | **13/13 test files passed, 121/121 tests passed** (1.36s) | `0` (Success) |
| `npm run build`        | Next.js production build (`next build`) | Successfully compiled in 727ms                            | `0` (Success) |

### Test Suite Breakdown:

- `tests/unit/game/timer-and-lifecycle.test.ts`: 11 tests passed
- `tests/unit/components/result-screens.test.tsx`: 2 tests passed
- `tests/unit/components/game-board.test.tsx`: 6 tests passed
- `tests/unit/components/letter-grid.test.tsx`: 8 tests passed
- `tests/unit/game/validate-puzzle.test.ts`: 15 tests passed
- `tests/unit/game/normalize-and-check-answer.test.ts`: 21 tests passed
- `tests/unit/game/evaluate-letters.test.ts`: 8 tests passed
- `tests/unit/game/letter-grid.test.ts`: 12 tests passed
- `tests/unit/game/scoring-and-hints.test.ts`: 16 tests passed
- `tests/unit/game/round-state.test.ts`: 13 tests passed
- `tests/unit/constants.test.ts`: 3 tests passed
- `tests/unit/shell.test.tsx`: 3 tests passed
- `tests/unit/utils.test.ts`: 3 tests passed

---

## 4. Outstanding Issues & Notes

- **None**. All tests, builds, lints, and type checks pass with 0 warnings and 0 errors.
- Both winning and timeout flows are fully automated and verified under fake timers.

---

## 5. Exact Next Step

- **Part 5**: Implement Daily and Classic modes, UTC midnight calendar scheduling, Classic mode endless replay with difficulty tiers, and client-side LocalStorage state persistence.
