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

## ADR-015: Local-Midnight Daily Challenge Scheduling with Server-Authoritative Anti-Cheat

- **Date**: 2026-10-12 (Updated 2026-10-20)
- **Status**: Accepted
- **Context**: The Daily challenge requires resetting at exact local midnight (12:00:00 AM) in each player's local timezone so that players receive a fresh puzzle at the start of their calendar date, while strictly preventing device clock tampering from unlocking future challenges.
- **Decision**:
  1. Resolve player timezone dynamically (`Intl.DateTimeFormat().resolvedOptions().timeZone` on client; `x-timezone`, `flipped_tz` cookie, then `x-vercel-ip-timezone` edge header on server). The device timezone wins over IP geolocation so VPN users and travellers still roll over at their real local midnight.
  2. Compute calendar date (`YYYY-MM-DD`) by reading `formatToParts` for the player's resolved timezone. Never force a hard-coded UTC timezone; if no IANA zone is available, use the runtime's local calendar fields.
  3. Server-Authoritative Anti-Cheat: Validate requested date against `new Date()` (server atomic clock) projected to player's timezone. Reject requests where `targetDate > maxAllowedDate` with `status: "FUTURE_UNPUBLISHED"`.
  4. Real-Time Local Midnight Countdown: Find the exact next instant at which the player's local calendar date changes (binary search over real timestamps), so 23-hour and 25-hour DST days are handled correctly.
  5. Always-On Schedule: Curated dates are published explicitly, and every other date after launch is deterministically auto-assigned from the puzzle corpus. An `UNPUBLISHED` or stale schedule row falls through to auto-scheduling so the daily challenge can never go offline.
- **Rationale**:
  - Provides a natural, country-specific reset at midnight for every player worldwide.
  - Server atomic clock projection makes device clock tampering completely impossible.
  - Streak tracking, statistics, and archive availability seamlessly respect the player's local calendar day.
  - The daily calendar can never run out, even if nobody updates the static schedule.

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

---

## ADR-019: Editorial Design System, First-Time Onboarding & Focus Trap Dialog

- **Date**: 2026-10-12
- **Status**: Accepted
- **Context**: Players encountering Flipped need immediate clarity on its unique two-word transformation mechanic (`CLUE 1 + CLUE 2 → TARGET PHRASE`). Traditional text explanations without interactive practice lead to high bounce rates. Simultaneously, the application requires consistent editorial styling across home, header, footer, and subpages, with strict keyboard accessibility and focus management.
- **Decision**:
  1. **Editorial Design Tokens**: Standardize across all views on warm paper canvas (`#fcfbf9`), charcoal typography (`#24272c`), and coral accents (`#e26d5c`). Letter tiles feature tactile border lines, subtle shadows, and unambiguous state feedback.
  2. **First-Time Guided Onboarding Modal (`TutorialModal.tsx`)**: Inspects `flipped_onboarding_completed_v1` in `localStorage`. If absent, automatically surfaces a 3-step walkthrough culminating in an interactive practice grid solving `SLOW + MEAL` → `FAST FOOD`. Auto-detects completion and marks onboarding complete.
  3. **Accessible Modal Architecture**: Adheres to WAI-ARIA dialog patterns with `role="dialog"`, `aria-modal="true"`, background scroll locking, trapping focus, listening to Escape keys, and restoring focus to the prior active element upon closure.
- **Rationale**:
  - Hands-on practice with `FAST FOOD` immediately internalizes the game's mechanics in under 15 seconds.
  - Full keyboard accessibility and focus restoration ensure compliance with WCAG 2.2 AA standards.
  - Consistent editorial header and footer unify navigation across `/`, `/daily`, `/classic`, `/archive`, and `/stats`.

---

## ADR-020: Authoritative Player Statistics Engine & Spoiler-Free Result Sharing Flow

- **Date**: 2026-10-12
- **Status**: Accepted
- **Context**: Players require transparent tracking of their performance (win rates, streaks, solve times) and the ability to share results on social platforms and messaging apps without spoiling the daily puzzle solution for others.
- **Decision**:
  1. **Authoritative Statistics Calculation (`statistics.ts`, `/stats`)**: Compute all player metrics strictly from persisted attempt records (`DailyAttemptRecord` and Classic completed IDs) without simulated or mock data. Continuous calendar streaks are evaluated chronologically against the authoritative `Asia/Kolkata` date sequence, correctly detecting broken streaks while preserving active status for today's pending challenges.
  2. **Spoiler-Free Result Sharing (`share-result.ts`, `ShareButton.tsx`)**: Result text never exposes the target words or approved variants. Instead, it generates an emoji grid representing word lengths (`🟩🟩🟩🟩 🟩🟩🟩🟩` for wins, `⬛⬛⬛⬛ ⬛⬛⬛⬛` for timeouts) accompanied by score, elapsed seconds, and hints used.
  3. **Universal Share Dispatch**: Calls `navigator.share()` on supported mobile devices and gracefully falls back to `navigator.clipboard.writeText()` with a 2-second visual feedback badge (`Copied to Clipboard!`).
- **Rationale**:
  - Protects the competitive integrity and daily mystery of Flipped.
  - Provides rewarding, accurate stats that drive daily retention without misleading players with fabricated analytics.
  - Ensures seamless sharing across all browsers and operating systems.

---

## ADR-021: Zero Client Bundle Answer Leakage, App Router Cookie Security & Global Singleton State

- **Date**: 2026-10-12
- **Status**: Accepted
- **Context**: Security audits during Part 8 revealed three critical vectors:
  1. Client bundle analysis revealed that pages importing static puzzle arrays (`CURATED_PUZZLES`) bundled all target answer words into `.next/static/chunks/*.js`, allowing players to inspect solutions via `View Source` or DevTools network responses.
  2. Next.js App Router route handlers using raw `response.headers.set("Set-Cookie", ...)` failed to serialize `Set-Cookie` directives reliably in Chromium, breaking guest session persistence on reload.
  3. In Next.js dev server, isolated route handler compilation chunks generated separate instances of `inMemoryDb`, preventing attempts created in `/start` from being located in `/hint` or `/timeout`.
- **Decision**:
  1. **Strict Public vs Privileged Separation**: Created `src/features/game/data/public-puzzles.ts` exposing `PUBLIC_PUZZLE_METADATA` containing strictly `id`, `clueWords`, `difficulty`, and `wordLengths`. Client routes (`/archive`, `/classic`, `/`, `/daily`) and client helpers (`classic-selector.ts`, `daily-scheduler.ts`) import exclusively from `public-puzzles.ts`. Master puzzles with solutions (`puzzles.ts`) are strictly restricted to server repositories (`puzzle-repository.ts`).
  2. **Production Route Protection**: Unprotected development route `/play` redirects in production (`redirect("/classic")`) to prevent dev fixtures from being bundled into client assets.
  3. **Native Next.js Cookie Attachment (`attachGuestCookie`)**: Standardized all API routes on `response.cookies.set({ name, value, path, httpOnly, sameSite, secure, maxAge })`, ensuring reliable cookie setting and CSRF/Lax compliance.
  4. **Global Singleton in Dev Server**: Attached `inMemoryDb` to `globalThis` (`globalForDb.inMemoryDb = inMemoryDb`), mirroring the standard Prisma pattern and guaranteeing atomic state sharing across route handler invocations.
- **Rationale**:
  - Eliminates 100% of answer leakage from client-side JavaScript bundles (`0 occurrences` verified via binary bundle search).
  - Guarantees seamless guest session continuity across all modern browsers and test runners.
  - Fixes cross-route in-memory state desynchronization in local and CI environments.

---

## ADR-022: Unified Editorial 4-Color Palette and Complete Removal of Dark/Light Theme Switching

- **Date**: 2026-10-14
- **Status**: Accepted
- **Context**: The game previously supported a dark/light mode toggle with dynamic `data-theme` DOM attributes, localStorage listeners, mutation observers, and dual CSS variable overrides. The product direction required removing the theme switcher entirely and adopting a single, distinguished editorial palette across all views, HUD elements, modals, cards, and interactive letter tiles.
- **Decision**:
  1. **Strict 4-Color Palette**:
     - **Crimson**: `#7B1E2B` (primary brand accent, active selection borders, CTA button backgrounds, win streak indicators)
     - **Cream white**: `#F7F0E5` (canvas background, primary tile lettering, light card backgrounds)
     - **Dark wine**: `#32171D` (primary headings, filled/confirmed letter tile surfaces, high-contrast dark accents)
     - **Muted gold**: `#C49A6C` (tile borders, secondary borders, badges, trophy highlights, subtle dividers)
  2. **Complete Removal of Theme Switcher Residue**:
     - Removed `theme` state and `flipped-theme` localStorage synchronization in `Header.tsx`.
     - Removed sun/moon toggle button from `breadcrumb.tsx`.
     - Removed `MutationObserver` on `data-theme` from `TechText.jsx`.
     - Removed dark mode checks and default color overrides in `AcidSquares.tsx`.
     - Removed all `html[data-theme="dark"]` CSS selector overrides and `.theme-toggle` styles from `globals.css`.
  3. **Tailwind v4 Theme Variable Alignment**:
     - Reconfigured `@theme` color aliases in `globals.css` so that any legacy utility classes automatically map cleanly to the 4 colors.
- **Rationale**:
  - Establishes a bold, cohesive literary aesthetic tailored specifically to word deduction and editorial puzzles.
  - Simplifies the codebase by eliminating theme switching state management, observer callbacks, and dual-theme style divergence.
  - Guarantees 100% visual consistency across desktop and mobile devices.

---

## ADR-023: Official FLIPPED Brand Identity System Implementation

- **Date**: 2026-10-14
- **Status**: Accepted
- **Context**: The user provided the official brand identity system specification PDF ("FLIPPED — IDENTITY SYSTEM"). The specification details the mathematical geometry of the split-F symbol, favicon dimensions, color palette roles, horizontal lockup proportions, and brand copy.
- **Decision**:
  1. **Split-F Signature Symbol (64 × 64 source grid)**:
     - Spine width = 16 units, Open seam = 8 units.
     - Top bar diagonal cut: 45° cut (dx=-16, dy=16) from (64, 0) to (48, 16).
     - Middle tile diagonal cut: 45° cut (dx=-16, dy=16) from (56, 24) to (40, 40).
     - Geometry path: `M 0 0 L 64 0 L 48 16 L 16 16 L 16 64 L 0 64 Z M 24 24 L 56 24 L 40 40 L 24 40 Z`.
     - Preserves the separate middle tile and open seam without distortion, outlines, or enclosing circles.
  2. **Favicon System (16 · 32 · 48 & High-DPI)**:
     - Generated vector SVG favicon (`favicon.svg`) with Cream `#F7F0E5` symbol on Crimson `#7B1E2B` substrate.
     - Generated raster favicons matching exact inset rules: 16×16 (12px mark / 2px inset), 32×32 (24px mark / 4px inset), 48×48 (36px mark / 6px inset), 180×180 apple-touch-icon, and multi-resolution `favicon.ico`.
     - Added Web App Manifest (`manifest.ts`) linking high-res PWA icons (`icon-192.png`, `icon-512.png`).
  3. **Horizontal Lockup & Navigation Integration**:
     - Created `FlippedSymbol` and `FlippedLogo` in `src/components/FlippedLogo.tsx` adhering to horizontal lockup rules: mark height $h$, gap $0.5h$, wordmark font size $1.16h$, tracking $0.035h$, Inter Extra Bold 800 uppercase.
     - Replaced generic navigation icons with `FlippedSymbol` in `breadcrumb.tsx` and `Footer.tsx`.
     - Integrated signature symbol and official brand taglines (*"Quick decisions. Lasting impressions."*, *"Think fast. Flip the moment."*, *"A split second. A different game."*) into `page.tsx` and `layout.tsx`.
- **Rationale**:
  - Unifies product identity with the official brand book guidelines.
  - Ensures sharp, recognizable browser tabs, bookmarks, and mobile home screen icons across all screen densities.
  - Keeps branding scalable, deterministic, and 100% reproducible via `npm run brand:build`.
