# Flipped — Project Progress & Verification Record

## 1. Current Project Status

- **Current Stage**: Part 3 (Interactive Letter Grid & Gameplay UI)
- **Status**: **Completed & Fully Verified**
- **Date**: 2026-10-12
- **Repository State**: Clean git repository, zero unmanaged files, zero lint warnings/errors, 106/106 unit tests passing.

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
   - Live interactive development sandbox accessible via "Launch Interactive Grid Sandbox" on home screen.
   - Test fixture cycling control allowing immediate testing across all 12 test puzzles.

---

## 3. Verification Results

Every development script was executed and verified directly:

| Step / Command         | Target / Operation                      | Execution Result                                          | Exit Status   |
| :--------------------- | :-------------------------------------- | :-------------------------------------------------------- | :------------ |
| `npm run typecheck`    | TypeScript compiler (`tsc --noEmit`)    | Checked all files, zero type errors                       | `0` (Success) |
| `npm run lint`         | ESLint 9 analysis (`eslint .`)          | Analyzed all files, zero errors, zero warnings            | `0` (Success) |
| `npm run format:check` | Prettier check across code & markdown   | All files formatted cleanly                               | `0` (Success) |
| `npm run test`         | Vitest unit test suite (11 test suites) | **11/11 test files passed, 106/106 tests passed** (1.05s) | `0` (Success) |
| `npm run build`        | Next.js production build (`next build`) | Successfully compiled in 1179ms                           | `0` (Success) |

### Test Suite Breakdown:

- `tests/unit/components/letter-grid.test.tsx`: 8 tests passed
- `tests/unit/components/game-board.test.tsx`: 4 tests passed
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
- Both desktop physical keyboards and mobile virtual keyboards are fully supported via the hidden buffer input and roving index.

---

## 5. Exact Next Step

- **Part 4**: Implement the 60-second countdown timer, dynamic timer penalty score updates, timeout handling, Daily mode UTC midnight scheduling, Classic mode endless replay, and LocalStorage state persistence.
