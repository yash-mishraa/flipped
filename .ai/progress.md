# Flipped — Project Progress & Verification Record

## 1. Current Project Status

- **Current Stage**: Part 8 (Final QA, Security Audit, End-to-End Testing, and Deployment Readiness)
- **Status**: **Completed & Fully Verified**
- **Date**: 2026-10-12
- **Repository State**: Clean git repository, zero answer leaks in client bundles, zero lint warnings/errors, 199/199 unit and integration tests passing across 28 test suites, 12/12 Playwright E2E tests passing across 5 test suites.

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

### Stage 5 (Daily and Classic Game Modes, Calendar Scheduling & Local Persistence) — Completed

1. **Deterministic Daily Calendar Scheduling (`src/features/game/modes/daily-scheduler.ts`, `data/daily-schedule.ts`)**:
   - `getDailyDateString`: standardizes on `Asia/Kolkata` (IST) timezone, reliably returning `YYYY-MM-DD` strings.
   - `getDailyPuzzle`: deterministically retrieves the published daily challenge or safely reports `FUTURE_UNPUBLISHED` or `UNAVAILABLE` without leaking puzzle data.
   - `getPublishedDailySchedule`: chronologically enumerates all published challenges for the archive.

2. **Repetition-Free Classic Mode Selector (`src/features/game/modes/classic-selector.ts`)**:
   - `selectClassicPuzzle`: filters curated puzzle bank strictly by requested difficulty (`EASY`, `MEDIUM`, `HARD`).
   - Excludes recently played puzzle IDs; gracefully wraps when the tier is exhausted while avoiding the immediate previous puzzle.

3. **Local Progress Persistence Adapter (`src/features/game/persistence/local-progress.ts`)**:
   - Versioned storage schema `flipped_progress_v1` tracking Daily attempt records and Classic history (`recentlyPlayedIds`, `totalPlayed`, `totalWins`, `lastDifficulty`).
   - In-memory store fallback for SSR and restricted private browsing environments.
   - Enforces single daily attempt lock: both `WON` and `TIMED_OUT` persist records and prevent further scored attempts on that calendar date.

4. **Difficulty Selector Component (`src/features/game/components/DifficultySelector.tsx`)**:
   - Interactive radio selection across Easy, Medium, and Hard challenge tiers with visual badges and vocabulary descriptions.

5. **Daily Completion Card (`src/features/game/components/DailyCompletionCard.tsx`)**:
   - Comprehensive read-only review of completed daily puzzles, preserving score, elapsed time, hints, explanations, and solved letter grid.

6. **Dedicated Pages & Navigation**:
   - `src/app/page.tsx`: Production home screen with active Daily and Classic mode launch cards, archive link, and rules guide.
   - `src/app/daily/page.tsx`: Daily challenge flow enforcing the single-attempt lock and rendering `DailyCompletionCard` when completed.
   - `src/app/classic/page.tsx`: Classic mode flow with tier selection, repetition-free puzzle sequencing, live win rate tracking, and unlimited replay.
   - `src/app/archive/page.tsx`: Daily archive listing past calendar challenges and player completion status.

### Stage 6 (Backend, Database & Secure Game Infrastructure) — Completed

1. **Prisma Relational Database & Migrations (`prisma/schema.prisma`, `prisma/migrations/`)**:
   - Normalized schema with `Puzzle`, `DailyAssignment`, `GuestProfile`, and `GameAttempt` models.
   - Enforces `@@unique([guestId, dailyDate])` preventing multiple scored daily attempts on the same calendar date.
   - Initial PostgreSQL DDL migration: `prisma/migrations/20261012000000_init/migration.sql`.
   - Repeatable seed script: `prisma/seed.ts` upserting 12 curated puzzles and published schedule.

2. **Database Client & In-Memory Fallback Adapter (`src/server/db/client.ts`)**:
   - Singleton Prisma client handling PostgreSQL connections.
   - Seamless `InMemoryDatabase` fallback providing zero-config execution for unit tests and local/CI builds when `DATABASE_URL` is omitted.

3. **Signed Guest Session Security (`src/server/auth/guest-session.ts`)**:
   - Cryptographically signed cookie tokens (`guestId.timestamp.hmac`) using HMAC-SHA256.
   - Constant-time verification (`crypto.timingSafeEqual`) preventing timing attacks.
   - Cookie security directives: `httpOnly: true`, `sameSite: "lax"`, `secure` in production.

4. **Sliding-Window Rate Limiting (`src/server/utils/rate-limit.ts`)**:
   - In-memory rate limiter tracking IP/guest attempt bursts to protect submission endpoints from dictionary attacks.

5. **Server Puzzle Repository & Zero Answer Leakage (`src/server/puzzles/puzzle-repository.ts`)**:
   - `createSafeGameplayPayload`: strictly omits canonical answers, approved variants, and transformation target words.
   - `createFinalizedResultPayload`: reveals answers only after the attempt has reached `WON` or `TIMED_OUT`.

6. **Authoritative Game Lifecycle & Attempt Service (`src/server/game/attempt-service.ts`)**:
   - Server-enforced start timestamps and 60-second deadlines.
   - Authoritative scoring via `calculateScore` based on server elapsed time and server-tracked hint count.
   - Strict deadline enforcement: submissions at or after deadline transition to `TIMED_OUT` with 0 points.
   - Atomic state transitions and idempotent finalized attempt retrieval.

7. **Authoritative Hint Service (`src/server/game/hint-service.ts`)**:
   - Validates active attempt and deadline window.
   - Dispatches only the single next letter in reading order with its position, deducting 5 points. Never reveals full solution.

8. **App Router API Route Handlers (`src/app/api/`)**:
   - `/api/health`: Health status and database connectivity mode.
   - `/api/game/daily/start`: Initiates or resumes daily attempt with guest cookie.
   - `/api/game/classic/start`: Initiates classic round with Zod payload validation.
   - `/api/game/attempt/[id]/submit`: Validates candidate phrase and finalizes round.
   - `/api/game/attempt/[id]/timeout`: Finalizes expired attempts.
   - `/api/game/attempt/[id]/hint`: Authoritative hint dispatch.
   - `/api/game/attempt/[id]`: Returns finalized results (HTTP 403 while active).
   - `/api/game/daily/status`: Returns current daily challenge status.

9. **Frontend Integration (`src/features/game/components/ServerGameBoard.tsx`)**:
   - Plays against `SafeGameplayPayload` without local solution knowledge.
   - Submits candidate answers to server endpoint.
   - Fetches authoritative hints via API and renders dynamic board state.
   - Connected directly to `/daily` and `/classic` pages.

### Stage 7 (Complete Product UI & Production Experience) — Completed

1. **Editorial Puzzle Design System & Layout**:
   - High-contrast editorial palette: warm paper canvas (`#fcfbf9`), charcoal (`#24272c`), and coral accents (`#e26d5c`).
   - `Header.tsx`: Sticky navigation bar with wordmark, desktop nav links, and accessible mobile drawer.
   - `Footer.tsx`: Editorial footer with keyboard navigation guide, security badges, and "How to Play" trigger.
   - Home Screen (`src/app/page.tsx`): Live IST midnight countdown, real daily status, difficulty puzzle counts, "How Flipped Works" visual cards, and quick links.

2. **Interactive First-Time Onboarding (`TutorialModal.tsx`)**:
   - 3-step walkthrough explaining core two-word transformation mechanics.
   - Interactive 4x4 practice sandbox solving `SLOW + MEAL` → `FAST FOOD` with auto-detection.
   - Accessible WAI-ARIA dialog pattern (`role="dialog"`, focus trap, Escape dismiss, focus restoration).
   - Persisted completion flag in `flipped_onboarding_completed_v1`.

3. **Spoiler-Free Result Sharing System (`share-result.ts`, `ShareButton.tsx`)**:
   - Protects puzzle solutions by never leaking canonical target words or variants.
   - Generates masked emoji block grids (`🟩🟩🟩🟩 🟩🟩🟩🟩` for wins, `⬛⬛⬛⬛ ⬛⬛⬛⬛` for timeouts).
   - Native Web Share API (`navigator.share`) with instant clipboard fallback (`navigator.clipboard.writeText`) and 2s visual copied badge.
   - Integrated across `SuccessScreen`, `TimeoutScreen`, and `DailyCompletionCard`.

4. **Authoritative Player Statistics (`statistics.ts`, `src/app/stats/page.tsx`)**:
   - Dedicated `/stats` page with real KPI cards, streak tracking, and difficulty breakdowns.
   - Pure statistics engine calculating total games, win rate, average/fastest solve time, and calendar streaks.
   - Chronological calendar streak walking across `Asia/Kolkata` date boundaries without simulation.

5. **Accessibility & Usability Hardening (WCAG 2.2 AA)**:
   - Silent timer ticking (`aria-live="off"`) asserting only at urgency (<10s) and expiration (0s).
   - High-contrast visible focus rings across all buttons, tiles, links, and drawer triggers.
   - Full reduced motion query compliance across keyframe animations.

### Stage 8 (Final QA, Security Audit, End-to-End Testing, and Deployment Readiness) — Completed

1. **Security Audit & Bundle De-Leakage**:
   - Discovered and eliminated client-side bundle answer leakage: created `src/features/game/data/public-puzzles.ts` with safe metadata strictly excluding answers and transformation targets.
   - Redirected `/play` in production (`redirect("/classic")`) to protect development fixtures.
   - Verified zero occurrences of target solutions in `.next/static/` via automated script checks and dedicated unit tests (`bundle-leakage.test.ts`).
2. **Next.js 15 Cookie & In-Memory State Hardening**:
   - Replaced raw `response.headers.set("Set-Cookie")` with native Next.js `response.cookies.set(...)` (`attachGuestCookie`), ensuring reliable HMAC-SHA256 signed cookie serialization in Chromium and across page reloads.
   - Attached `inMemoryDb` to `globalThis` (`globalForDb.inMemoryDb`) as an App Router development singleton, preventing state wipeouts across route handler bundles.
3. **Playwright E2E Test Suite (Journeys A through F)**:
   - Configured dedicated port `3005` in `playwright.config.ts` to isolate test runs.
   - Implemented 12 comprehensive end-to-end tests across 5 test specs:
     - `tests/e2e/smoke.spec.ts`: Landing page shell and title verification.
     - `tests/e2e/first-time-and-classic.spec.ts`: Journey A (tutorial modal onboarding & skip to Classic) and Journey B (tile entry, editing, backspace, automatic validation).
     - `tests/e2e/hints-and-timeout.spec.ts`: Journey C (hint deduction & letter reveal) and Journey D (60s authoritative timeout & canonical reveal).
     - `tests/e2e/daily-restrictions.spec.ts`: Journey E (daily single-attempt lock & reload persistence).
     - `tests/e2e/resilience-and-accessibility.spec.ts`: Journey F (responsive viewport audit at 320px, 390px, 768px, 1280px without horizontal scroll, keyboard roving tabindex, header routing).
4. **Complete Verification & Build Success**:
   - All 199 Vitest unit tests pass across 28 test suites.
   - All 12 Playwright E2E tests pass across 5 test suites.
   - Prettier, ESLint, TypeScript (`tsc --noEmit`), and Next.js production build (`next build`) pass with 0 errors and 0 warnings.

---

## 3. Verification Results

Every development script was executed and verified directly:

| Step / Command         | Target / Operation                      | Execution Result                                          | Exit Status   |
| :--------------------- | :-------------------------------------- | :-------------------------------------------------------- | :------------ |
| `npm run typecheck`    | TypeScript compiler (`tsc --noEmit`)    | Checked all files, zero type errors                       | `0` (Success) |
| `npm run lint`         | ESLint 9 analysis (`eslint .`)          | Analyzed all files, zero errors, zero warnings            | `0` (Success) |
| `npm run format:check` | Prettier check across code & markdown   | All files formatted cleanly                               | `0` (Success) |
| `npm test`             | Vitest unit test suite (28 test suites) | **28/28 test files passed, 199/199 tests passed** (2.24s) | `0` (Success) |
| `npx playwright test`  | Playwright E2E suite (5 test suites)    | **5/5 test files passed, 12/12 tests passed** (7.5s)      | `0` (Success) |
| `npm run build`        | Next.js production build (`next build`) | Successfully compiled (9 static, 7 dynamic routes)        | `0` (Success) |

### Test Suite Breakdown (199 unit tests across 28 suites):

- `tests/unit/security/bundle-leakage.test.ts`: 5 tests passed
- `tests/unit/components/share-result.test.tsx`: 6 tests passed
- `tests/unit/components/tutorial-modal.test.tsx`: 4 tests passed
- `tests/unit/components/stats-page.test.tsx`: 2 tests passed
- `tests/unit/modes/statistics.test.ts`: 9 tests passed
- `tests/unit/components/letter-grid.test.tsx`: 8 tests passed
- `tests/unit/components/game-board.test.tsx`: 6 tests passed
- `tests/unit/components/result-screens.test.tsx`: 2 tests passed
- `tests/unit/components/mode-components.test.tsx`: 2 tests passed
- `tests/unit/server/api-routes.test.ts`: 7 tests passed
- `tests/unit/server/attempt-service.test.ts`: 10 tests passed
- `tests/unit/server/guest-session.test.ts`: 6 tests passed
- `tests/unit/server/puzzle-security.test.ts`: 3 tests passed
- `tests/unit/server/rate-limit.test.ts`: 1 test passed
- `tests/unit/modes/daily-scheduler.test.ts`: 7 tests passed
- `tests/unit/modes/classic-selector.test.ts`: 6 tests passed
- `tests/unit/modes/round-configuration.test.ts`: 4 tests passed
- `tests/unit/persistence/local-progress.test.ts`: 5 tests passed
- `tests/unit/game/timer-and-lifecycle.test.ts`: 11 tests passed
- `tests/unit/game/validate-puzzle.test.ts`: 15 tests passed
- `tests/unit/game/normalize-and-check-answer.test.ts`: 21 tests passed
- `tests/unit/game/evaluate-letters.test.ts`: 8 tests passed
- `tests/unit/game/letter-grid.test.ts`: 12 tests passed
- `tests/unit/game/scoring-and-hints.test.ts`: 16 tests passed
- `tests/unit/game/round-state.test.ts`: 13 tests passed
- `tests/unit/constants.test.ts`: 3 tests passed
- `tests/unit/shell.test.tsx`: 4 tests passed
- `tests/unit/utils.test.ts`: 3 tests passed

---

## 4. Outstanding Issues & Notes

- **None**. All 199 unit tests, 12 Playwright E2E tests, Next.js production build, ESLint, and TypeScript checks pass with 0 warnings and 0 errors.

---

## 5. Project Roadmap Status

- **All Stages (Parts 1 through 8) Complete**.
- The project is fully tested, hardened, and ready for production deployment.
