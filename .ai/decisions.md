# Flipped — Architectural Decisions Log

This document records architectural decisions, their context, alternatives considered, and rationale. Future modifications should append new dated entries rather than rewriting historic decisions.

---

## ADR-001: Next.js with App Router as Application Framework

- **Date**: 2026-10-12
- **Status**: Accepted
- **Context**: The game requires a responsive, high-performance web frontend that will subsequently integrate with a server-authoritative backend, database (PostgreSQL), and secure API routes for Daily challenges and leaderboards.
- **Decision**: Adopt Next.js 15+ with App Router.
- **Rationale**:
  - Unifies client presentation, static asset delivery, and future server-side API endpoints within a single cohesive framework.
  - Server Components reduce client bundle size for informational landing sections.
  - Native support for Route Handlers and Server Actions simplifies future server-authoritative Daily validation (Stage 6).
- **Alternatives Considered**:
  - _Vite + React SPA_: Excellent for pure client apps, but requires introducing a separate backend service / server framework for Stage 6 (PostgreSQL & secure validation).
  - _Remix_: Viable, but Next.js provides wider community adoption and seamless deployment targets.

---

## ADR-002: npm as the Package Manager

- **Date**: 2026-10-12
- **Status**: Accepted
- **Context**: Selection of a deterministic package manager available in the environment.
- **Decision**: Standardize on npm.
- **Rationale**:
  - npm is the default package manager bundled directly with Node.js LTS, ensuring zero additional bootstrap prerequisites for any developer or CI environment.
  - `package-lock.json` provides strict dependency locking and deterministic builds.

---

## ADR-003: Pure Headless Game Engine Decoupled from React UI

- **Date**: 2026-10-12
- **Status**: Accepted
- **Context**: The core word puzzle mechanics (letter state evaluation, duplicate letter resolution, automatic answer detection, scoring) must be robust, reliable, and easily testable.
- **Decision**: Implement all core game rules in pure TypeScript modules within `src/features/game/` completely decoupled from React hooks or DOM state.
- **Rationale**:
  - Allows 100% test coverage using fast Vitest unit tests without needing React rendering or DOM mocking.
  - Prevents UI components from accumulating business logic.
  - Enables reusability: the same engine logic or validation rules can be imported in future server-side Route Handlers for anti-cheat verification.

---

## ADR-004: Direct Grid Editing with Automatic Detection (No Submit Button)

- **Date**: 2026-10-12
- **Status**: Accepted
- **Context**: Conventional word puzzles (e.g., standard Wordle clones) rely on virtual text inputs and manual "ENTER" / "SUBMIT" buttons, introducing unnecessary friction and feeling disconnected from physical paper/board puzzles.
- **Decision**: The central interaction is an editable letter grid with automatic answer detection.
- **Rationale**:
  - When a target row or sequence is filled with a valid word, the engine detects and evaluates it immediately.
  - Provides a tactile, intuitive feel where players directly manipulate letter tiles.
  - Preserves clean visual hierarchy without cluttering the screen with redundant submit controls.

---

## ADR-005: Dual Testing Strategy (Vitest for Unit, Playwright for E2E)

- **Date**: 2026-10-12
- **Status**: Accepted
- **Context**: Ensuring comprehensive verification across isolated puzzle mechanics, UI components, and full cross-browser user journeys.
- **Decision**:
  - **Vitest + @testing-library/react + jsdom**: For instant unit testing of game engine logic, state transitions, utility functions, and component rendering.
  - **Playwright**: For browser-level end-to-end testing of complete game cycles, keyboard inputs, responsive layouts, and cross-browser regression testing in Stage 8.
- **Rationale**:
  - Vitest provides exceptional speed and native TypeScript/ESM support.
  - Playwright provides reliable multi-browser automation without flakiness.

---

## ADR-006: Feature-Driven Project Structure

- **Date**: 2026-10-12
- **Status**: Accepted
- **Context**: Need a scalable directory layout that separates shared utilities from domain-specific features as the project expands from 2 modes to backend systems.
- **Decision**:
  - `src/app/`: Application routing and layouts.
  - `src/components/`: Reusable presentation components (e.g., `ModeCard`).
  - `src/features/game/`: Isolated game domain (engine, rules, constants, hooks).
  - `src/lib/`: Generic utilities.
  - `src/types/`: Shared TypeScript type definitions.
  - `tests/unit/`: Vitest test suites.
  - `tests/e2e/`: Playwright test suites.
- **Rationale**:
  - Isolates feature code cleanly, preventing cross-domain spaghetti code as stages progress.

---

## ADR-007: Semantic Two-Word Puzzle Schema with Authoritative Transformations

- **Date**: 2026-10-12
- **Status**: Accepted
- **Context**: The game is based on solving phrase pairs via semantic transformations (synonyms/antonyms). We need a data structure that pairs clues, answers, relationship types, and explanations together without external runtime API dependencies.
- **Decision**: Define an authoritative `Puzzle` schema with explicit `WordTransformation` tuples and optional `approvedVariants`. Validate structure strictly while decoupling lexical verification from runtime external AI/dictionary APIs.
- **Rationale**:
  - Eliminates network latency and third-party API instability during gameplay.
  - Ensures deterministic offline and test verification.
  - Keeps clue words, canonical answers, relationship types (`SYNONYM` | `ANTONYM`), and explanations coupled in a single verifiable record.

---

## ADR-008: Two-Pass Letter Elimination with Frequency Accounting

- **Date**: 2026-10-12
- **Status**: Accepted
- **Context**: Players need feedback when a letter cannot belong in the answer, but repeated characters (e.g., `FOOD` with 2 'O's) and misplaced characters must not be prematurely eliminated.
- **Decision**: Implement a two-pass deterministic evaluation algorithm:
  1. Pass 1: Identifies fixed letters and exact positional matches, marking them `CONFIRMED` and decrementing the target character pool.
  2. Pass 2: For remaining non-matching letters, if the letter still has unassigned frequency in the target pool, mark it `PENDING` (available, but wrong position). Only mark `ELIMINATED` if the letter does not appear in the word or its frequency is already exhausted.
- **Rationale**:
  - Prevents premature elimination when a letter belongs elsewhere in the word.
  - Accurately distinguishes between single and multi-occurrence letters.
  - Preserves the player's ability to freely edit and correct tiles before the round concludes.

---

## ADR-009: Reactive Auto-Win Detection without Submit Button

- **Date**: 2026-10-12
- **Status**: Accepted
- **Context**: Following ADR-004, the grid interaction is continuous and reactive. When the player enters the final correct letter, the game should immediately detect the win without requiring an explicit submit button.
- **Decision**: In `applyLetterInput`, automatically evaluate `checkGridAnswer` after updating the grid. If `isMatch === true`, immediately transition the round to `WON` with a terminal result and frozen score.
- **Rationale**:
  - Maximizes tactile responsiveness and eliminates UI button clutter.
  - Prevents race conditions where a player enters the correct solution but fails to press submit before the timer expires.

---

## ADR-010: Reading-Order Deterministic Hint Policy

- **Date**: 2026-10-12
- **Status**: Accepted
- **Context**: The game supports hints that reveal letters with a 5-point penalty. The hint engine must be deterministic, framework-independent, and non-destructive.
- **Decision**: Scan tiles in reading order (Word 0 left-to-right, then Word 1 left-to-right). Select the first tile that is neither fixed nor already solved with the correct letter. Apply scoring deduction via the independent `scoring` module.
- **Rationale**:
  - Deterministic policy guarantees predictable, repeatable hints.
  - Never overwrites fixed clue letters or correct player entries.
  - Keeps scoring rules separated from hint selection logic.

---

## ADR-011: Roving Selection & Hidden Input Buffer for Desktop/Mobile Keyboard Parity

- **Date**: 2026-10-12
- **Status**: Accepted
- **Context**: On mobile touchscreens, virtual keyboards only display when a native text input or contentEditable element receives focus. On desktop keyboards, players expect fluid typing directly into the grid with arrow navigation and Backspace erasing across word boundaries.
- **Decision**: Implement a dual-capture pattern:
  1. An off-screen hidden input buffer (`<input className="sr-only" ... />`) keeps focus synchronized with `selectedPosition`, triggering mobile virtual keyboards.
  2. The parent container intercepts standard keyboard events (`onKeyDown` for Arrow keys, Home, End, Backspace, Delete, and alphabet characters `A-Z`).
  3. Navigation automatically skips over fixed clue letters and advances across word boundaries.
- **Rationale**:
  - Ensures 100% parity across desktop hardware keyboards, mobile on-screen keyboards, and screen readers without requiring separate input components.
  - Keeps individual letter tiles purely representational while maintaining native focus management and accessibility.

---

## ADR-012: Explicit Client Component Boundaries for Interactive Game UI

- **Date**: 2026-10-12
- **Status**: Accepted
- **Context**: Next.js App Router defaults all files in `src/app/` to Server Components unless designated with `"use client"`. The feature index barrel (`src/features/game/index.ts`) re-exports pure domain logic, constants, interactive UI components, and stateful hooks.
- **Decision**: All interactive React components (`GameBoard`, `LetterGrid`, `LetterTile`, `HintControl`, `GameFeedback`, `GameInstructions`) and hooks (`usePuzzleRound`) explicitly include the `"use client";` directive at line 1.
- **Rationale**:
  - Allows Server Components (such as `src/app/page.tsx`) to safely import static configuration and pure domain constants from `@/features/game` without encountering React Hook boundary errors during production compilation (`next build`).
  - Clear architectural separation between server-renderable shells and interactive client state trees.

---

## ADR-013: Deadline-Based Countdown Architecture with Tab Visibility Synchronization

- **Date**: 2026-10-12
- **Status**: Accepted
- **Context**: Countdown timers in browser JavaScript frequently drift if implemented via simple integer decrements (`count - 1`), especially when browsers throttle timers in background tabs or battery saver modes.
- **Decision**: Calculate remaining time strictly from a target deadline timestamp ($\text{deadline} = \text{startTime} + 60\,000\,\text{ms}$). Subscribe to the `visibilitychange` event so returning to the tab immediately evaluates the real elapsed time from `Date.now()`.
- **Rationale**:
  - Eliminates tick drift entirely; UI updates at 100ms intervals display accurate whole seconds without accumulating fractional errors.
  - Guarantees background tabs never receive extra time; returning after 60 seconds have passed triggers expiration immediately.

---

## ADR-014: Authoritative Deadline Evaluation and Timeout Score Practice Distinction

- **Date**: 2026-10-12
- **Status**: Accepted
- **Context**: Potential race conditions occur when a player enters the last letter or requests a hint at the exact moment the timer expires. Furthermore, scoring policy must decide how to treat players who run out of time without solving.
- **Decision**:
  1. Atomic deadline rule: letter inputs and hint requests are accepted only if processed before the authoritative deadline ($\text{Date.now()} < \text{deadline}$). Inputs at or after the deadline transition the round to `TIMED_OUT` rather than `WON`.
  2. Scoring distinction: timed-out rounds score **0** officially, but the timeout screen presents their practice score ($\max(0, 100 - \lfloor\text{elapsed}/5\rfloor - 5\times\text{hints})$) as an encouraging practice metric.
- **Rationale**:
  - Prevents confusing edge cases where delayed UI renders might award a victory after deadline expiration.
  - Encourages player learning without polluting official solve scoring with incomplete puzzles.

---

## ADR-015: Deterministic Calendar Daily Scheduling via Asia/Kolkata Timezone

- **Date**: 2026-10-12
- **Status**: Accepted
- **Context**: The Daily challenge requires assigning exactly one curated puzzle per calendar day, resetting at midnight. A universal reference timezone is necessary to avoid client device clock tampering and inconsistent date boundaries across players.
- **Decision**:
  1. Standardize on `Asia/Kolkata` (IST, UTC+5:30) as the authoritative game timezone using `Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" })` to produce strict `YYYY-MM-DD` strings.
  2. Map calendar dates deterministically against the curated published schedule (`PUBLISHED_DAILY_SCHEDULE`).
  3. Reject unpublished future puzzles with `status: "FUTURE_UNPUBLISHED"` to prevent client-side answer leakage.
- **Rationale**:
  - `en-CA` locale consistently outputs ISO `YYYY-MM-DD` across Node.js, V8, and browser runtimes.
  - Consistent timezone ensures all players share the exact same daily puzzle globally.
  - Clear separation between published archive entries and future unpublished dates protects game integrity.

---

## ADR-016: Local Progress Persistence with Single Daily Attempt Lock and Repetition-Free Classic Selection

- **Date**: 2026-10-12
- **Status**: Accepted
- **Context**: Prior to backend database integration (Stage 6), the application requires client-side completion tracking, daily challenge single-attempt enforcement, and Classic mode replay without immediate repetition.
- **Decision**:
  1. Implement a versioned `localStorage` adapter (`flipped_progress_v1`) with in-memory fallback for SSR and restricted private browsing environments.
  2. Enforce Daily single-attempt rule locally: both `WON` and `TIMED_OUT` outcomes persist a `DailyAttemptRecord`. When visiting `/daily`, an existing record renders `DailyCompletionCard` in read-only mode, disabling scored retries.
  3. Implement repetition-free Classic selection: filter by difficulty tier, exclude the last $N$ played puzzle IDs (`recentlyPlayedIds`), and wrap gracefully when the tier pool is exhausted while avoiding the immediate previous puzzle.
- **Rationale**:
  - Provides a complete, fully playable client-side experience for both Daily and Classic modes before Stage 6 backend deployment.
  - Prevents cheating or re-rolling of daily scores on the same browser.
  - Graceful fallback ensures no crashes occur during SSR pre-rendering or in restricted browser security contexts.

---

## ADR-017: Server-Authoritative Timing, Zero Answer Leakage & Signed Guest Sessions

- **Date**: 2026-10-12
- **Status**: Accepted
- **Context**: In client-rendered puzzle games, solutions transmitted in JSON payloads or props are trivially inspectable via browser Developer Tools. Furthermore, untrusted client-supplied timers and scores can be manipulated. Daily challenge integrity requires that canonical solutions remain server-side until game completion, and that time limits, scoring, and hints are calculated authoritatively on the server.
- **Decision**:
  1. **Zero Answer Leakage**: The server never transmits canonical answers, approved variants, or transformation target words to the client during active gameplay (`SafeGameplayPayload`). The client receives only clue words, word lengths, and initial clue letters (`firstLetters`).
  2. **Authoritative Deadline & Score Evaluation**: Round start (`/api/game/daily/start`, `/api/game/classic/start`) records `startedAt` and an immutable 60-second `deadline` on the server. When answers are submitted (`/api/game/attempt/[id]/submit`), the server checks answer equivalence, evaluates the timestamp against the deadline, computes the score using `calculateScore(elapsedSeconds, hintsUsed)`, and seals the record atomically.
  3. **Authoritative Hint Dispatch**: Hints are requested via `/api/game/attempt/[id]/hint`. The server validates that the attempt is still active, tracks hint count, applies the 5-point deduction, and returns only the single authorized letter and target cell coordinates without disclosing other letters.
  4. **Signed Guest Session Model**: Unauthenticated players receive a cryptographically signed guest session token (`guestId.timestamp.hmac`) generated with HMAC-SHA256, persisted in `HttpOnly`, `SameSite=Lax`, `Secure` cookies.
  5. **Rate-Limiting**: Submission endpoints are protected by an in-memory sliding-window rate limiter to prevent automated brute-force attacks against target words.
- **Rationale**:
  - Protects game fairness and prevents inspection of unpublished daily solutions in network tabs.
  - Guarantees valid elapsed times and scores without trusting client clocks.
  - Enables zero-friction guest play while enforcing the strict one-attempt-per-day rule.

---

## ADR-018: PostgreSQL Persistence with Prisma ORM and In-Memory Fallback Adapter

- **Date**: 2026-10-12
- **Status**: Accepted
- **Context**: The game requires structured relational storage for puzzles, scheduled assignments, guest sessions, and attempts. However, automated testing suites, Next.js build compilation (`next build`), and local developer setups must execute seamlessly even in environments without a live PostgreSQL instance running on port 5432.
- **Decision**:
  1. **Prisma ORM & PostgreSQL Schema**: Define normalized models (`Puzzle`, `DailyAssignment`, `GameAttempt`, `GuestProfile`) in `prisma/schema.prisma` with explicit DDL migrations (`prisma/migrations/20261012000000_init/migration.sql`) and a repeatable seed script (`prisma/seed.ts`).
  2. **Database Unique Constraints**: Enforce the Daily single-attempt rule at the database level with `@@unique([guestId, dailyDate])` on `GameAttempt`, eliminating race conditions between concurrent tabs.
  3. **In-Memory Fallback Store**: Implement `InMemoryDatabase` alongside `PrismaClient` in `src/server/db/client.ts`. When `DATABASE_URL` is unset or unavailable, the repository smoothly delegates to the deterministic in-memory store.
- **Rationale**:
  - Provides full production schema rigor and ACID guarantees for PostgreSQL deployments.
  - Guarantees that `npm test` and `next build` execute reliably in CI and offline developer environments with zero external service dependencies.
