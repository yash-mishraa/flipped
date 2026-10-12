# Flipped — Implementation Roadmap

This document outlines the multi-stage implementation plan for the Flipped word puzzle game. Each stage defines explicit dependencies, core deliverables, and objective completion criteria.

---

## Stage Overview & Status

| Stage      | Name                                       | Status                   | Dependencies |
| :--------- | :----------------------------------------- | :----------------------- | :----------- |
| **Part 1** | Foundation & Development Shell             | **Completed (Verified)** | None         |
| **Part 2** | Pure Puzzle Engine & Letter Validation     | **Completed (Verified)** | Part 1       |
| **Part 3** | Interactive Letter Grid & Gameplay UI      | **Completed (Verified)** | Part 2       |
| **Part 4** | 60-Second Gameplay Loop, Timer & Results   | **Completed (Verified)** | Part 3       |
| **Part 5** | Game Modes (Daily/Classic) & Persistence   | **Completed (Verified)** | Part 4       |
| **Part 7** | Complete Product UI, Sharing & Statistics  | **Completed (Verified)** | Part 6       |
| **Part 8** | Production Hardening, E2E Testing & Launch | Planned                  | Part 7       |

---

## Detailed Stage Specifications

### Part 1 — Foundation & Development Shell

- **Status**: **Completed (Verified)**
- **Dependencies**: None.
- **Deliverables**:
  - Environment setup and validation (Node.js LTS, npm, Git).
  - Next.js 15 App Router project structure with strict TypeScript.
  - Tailwind CSS v4 styling configuration with off-white/charcoal/coral design tokens.
  - Development pipeline scripts: `dev`, `build`, `lint`, `typecheck`, `test`, `format:check`.
  - Testing suite configured with Vitest and jsdom.
  - Playwright configuration for future end-to-end integration.
  - Complete AI project documentation suite in `.ai/`.
  - Minimal application shell proving all tooling without mock gameplay.
- **Completion Criteria**:
  - All automated scripts (`build`, `lint`, `typecheck`, `test`, `format:check`) execute cleanly with zero errors or warnings.
  - Verified repository hygiene with correct `.gitignore`.

---

### Part 2 — Pure Puzzle Engine & Letter Validation

- **Status**: **Completed (Verified)**
- **Dependencies**: Part 1.
- **Deliverables**:
  - Headless word puzzle engine independent of UI frameworks.
  - Letter evaluation rules (Correct / Misplaced / Incorrect).
  - Multi-occurrence letter resolution logic (exact duplicate handling).
  - Lexicon and dictionary validation module.
  - Automatic answer detection trigger without manual submit button.
  - Deterministic score computation engine.
- **Completion Criteria**:
  - Comprehensive unit test suite covering word validation edge cases, letter counts, and state transitions with >95% code coverage.

---

### Part 3 — Interactive Letter Grid & Gameplay UI

- **Status**: **Completed (Verified)**
- **Dependencies**: Part 2.
- **Deliverables**:
  - Interactive letter grid component (`LetterGrid`, `LetterTile`) supporting direct cell editing.
  - Keyboard navigation (Arrow keys, Home, End, Backspace, direct letter entry).
  - Mobile touch support and virtual keyboard sync via hidden focus buffer input.
  - Tactile visual styling and multi-modal feedback reflecting tile states (`FIXED`, `CONFIRMED`, `PENDING`, `ELIMINATED`, `NONE`).
  - Real-time binding to Part 2 engine via `usePuzzleRound` hook with automatic win detection.
  - Hint integration control (`HintControl`) with 5-point deduction notification.
  - Accessible guidance drawer (`GameInstructions`) and screen-reader announcements.
  - Development sandbox page at `/play` with fixture switcher.
- **Completion Criteria**:
  - Players can smoothly enter, edit, and auto-detect words directly within the grid on desktop and mobile viewports.
  - 100% of component and engine unit tests pass (106/106 tests across 11 test suites).
  - Next.js production build succeeds cleanly.

---

### Part 4 — 60-Second Gameplay Loop, Timer & Results

- **Status**: **Completed (Verified)**
- **Dependencies**: Part 3.
- **Deliverables**:
  - Precision countdown timer module (`useGameTimer`, `timer-utils`) measuring against deadline timestamp.
  - Tab visibility synchronization (`visibilitychange`) preventing background-tab drift.
  - Visual urgency tiers (`normal`, `urgent`, `critical` with pulse animation, `expired`).
  - Initial `READY` state with prominent "Start Game (60s)" CTA and disabled grid input until active.
  - Comprehensive gameplay HUD (`GameHUD`, `GameTimer`) showing status, timer, score, and hints.
  - Atomic deadline evaluation preventing post-expiration wins.
  - Celebratory victory screen (`SuccessScreen`) with transformation explanations, frozen score, elapsed time, hints, and Play Again.
  - Encouraging timeout screen (`TimeoutScreen`) with solution reveal, transformation explanations, practice score metric, and Play Again.
  - Clean replay lifecycle creating unique `roundId` and resetting all timers and callbacks.
- **Completion Criteria**:
  - 100% of unit and component tests pass (121/121 tests across 13 test suites).
  - Clean ESLint, strict TypeScript, and Next.js production build with 0 warnings/errors.

---

### Part 5 — Game Modes (Daily/Classic), Scheduling & State Persistence

- **Status**: **Completed (Verified)**
- **Dependencies**: Part 4.
- **Deliverables**:
  - Daily mode deterministic scheduling using `Asia/Kolkata` (IST) reference timezone.
  - Published daily schedule and past challenge archive (`/archive`).
  - Classic mode repetition-free puzzle selector by difficulty tier (`EASY`, `MEDIUM`, `HARD`).
  - Versioned local progress persistence (`flipped_progress_v1`) with single-attempt daily lock.
  - Interactive mode cards on home screen (`/`), dedicated Daily (`/daily`) and Classic (`/classic`) routes.
- **Completion Criteria**:
  - Both Daily and Classic modes fully playable; single daily attempt strictly enforced locally; 145/145 tests pass.

---

### Part 6 — Backend, Database & Secure Game Infrastructure

- **Status**: **Completed (Verified)**
- **Dependencies**: Part 5.
- **Deliverables**:
  - PostgreSQL schema via Prisma 6 (`Puzzle`, `DailyAssignment`, `GuestProfile`, `GameAttempt`).
  - Migration DDL (`20261012000000_init/migration.sql`) and database seed script (`prisma/seed.ts`).
  - Resilient database client with transparent `InMemoryDatabase` fallback for tests and offline builds.
  - Zero answer leakage: active gameplay payload (`SafeGameplayPayload`) strips solutions; answers revealed only after terminal state.
  - Server-authoritative timing (60s deadline), scoring, and hint deduction (5 points per hint).
  - HMAC-SHA256 signed guest sessions via `HttpOnly` cookies.
  - App Router route handlers (`/api/game/daily/start`, `/api/game/classic/start`, `/api/game/attempt/[id]/submit`, `/api/game/attempt/[id]/hint`, `/api/game/attempt/[id]/timeout`, `/api/health`).
  - Frontend integration (`ServerGameBoard.tsx`) connected to `/daily` and `/classic`.
- **Completion Criteria**:
  - Solutions remain server-only during active play; scores and elapsed times computed authoritatively on server; 172/172 tests pass across 23 test suites.

---

### Part 7 — Complete Product UI, Onboarding & User Experience

- **Status**: **Completed (Verified)**
- **Dependencies**: Part 6.
- **Deliverables**:
  - Editorial puzzle design system, warm paper canvas (`#fcfbf9`), charcoal typography (`#24272c`), and coral accents (`#e26d5c`).
  - First-time onboarding modal (`TutorialModal.tsx`) with an interactive 4x4 practice sandbox solving `FAST FOOD`.
  - Spoiler-free result sharing engine (`share-result.ts`, `ShareButton.tsx`) with emoji block grids and clipboard fallback.
  - Authoritative player statistics calculator (`statistics.ts`) tracking streaks, win rates, and solve times across `Asia/Kolkata`.
  - Dedicated `/stats` page with KPI cards and honest empty states.
  - Sticky header (`Header.tsx`) and editorial footer (`Footer.tsx`) with full keyboard navigation instructions.
  - WCAG 2.2 AA accessibility: silent timer ticking, visible focus rings, non-color tile feedback, reduced motion support.
- **Completion Criteria**:
  - 194/194 unit tests pass; zero lint warnings; clean Next.js production build (`next build`).

---

### Part 8 — Production Hardening, E2E Testing & Launch

- **Status**: Planned
- **Dependencies**: Part 7.
- **Deliverables**:
  - Full Playwright end-to-end test suite simulating complete game loops (Daily solve, timeout, hints, Classic replay).
  - Accessibility audit (WCAG 2.2 AA compliance, screen-reader verification, axe-core testing).
  - Lighthouse performance optimization (>95 across Performance, Accessibility, Best Practices, SEO).
  - Production deployment configuration, security review, and final launch sign-off.
- **Completion Criteria**:
  - All E2E tests pass reliably in CI; Lighthouse audits score >95; zero production warnings; production build deployed and verified.
