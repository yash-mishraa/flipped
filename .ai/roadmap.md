# Flipped — Implementation Roadmap

This document outlines the multi-stage implementation plan for the Flipped word puzzle game. Each stage defines explicit dependencies, core deliverables, and objective completion criteria.

---

## Stage Overview & Status

| Stage      | Name                                         | Status                   | Dependencies |
| :--------- | :------------------------------------------- | :----------------------- | :----------- |
| **Part 1** | Foundation & Development Shell               | **Completed (Verified)** | None         |
| **Part 2** | Pure Puzzle Engine & Letter Validation       | **Completed (Verified)** | Part 1       |
| **Part 3** | Interactive Letter Grid & Gameplay UI        | **Completed (Verified)** | Part 2       |
| **Part 4** | 60-Second Gameplay Loop, Timer & Results     | **Completed (Verified)** | Part 3       |
| **Part 5** | Game Modes (Daily/Classic) & Persistence     | Planned                  | Part 4       |
| **Part 6** | Player Statistics, Streaks & Share System    | Planned                  | Part 5       |
| **Part 7** | Backend Architecture & Database (PostgreSQL) | Planned                  | Part 6       |
| **Part 8** | Production Hardening, E2E Testing & Launch   | Planned                  | Part 7       |

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

- **Status**: Planned
- **Dependencies**: Part 4.
- **Deliverables**:
  - Daily mode scheduling with synchronized UTC midnight rollover.
  - Classic mode endless puzzle generator with selectable difficulty tiers.
  - LocalStorage snapshot persistence for in-progress game recovery.
  - Mode-specific rule enforcers.
- **Completion Criteria**:
  - Refreshing or closing browser tab preserves current puzzle progress; daily puzzle consistently loads identical word across players.

---

### Part 5 — Player Statistics, Streaks & Share System

- **Status**: Planned
- **Dependencies**: Part 4.
- **Deliverables**:
  - Persistent player statistics (games played, win rate, current/max streak, guess distribution).
  - Spoiler-free visual share card generator (grid emojis / copy to clipboard).
  - Completion modal with summary statistics.
- **Completion Criteria**:
  - Solves update local stats correctly; share card copies formatted results matching Wordle-style spoiler conventions.

---

### Part 6 — Backend Architecture & Database (PostgreSQL)

- **Status**: Planned
- **Dependencies**: Part 5.
- **Deliverables**:
  - PostgreSQL schema for daily puzzles, users, and game results.
  - Database migrations and connection pooling.
  - Server-authoritative daily puzzle API endpoint.
  - Secure score submission and validation endpoint to prevent client tampering.
- **Completion Criteria**:
  - Daily challenge answers are securely verified on the server; client cannot inspect solution payload in browser DevTools.

---

### Part 7 — Player Authentication & Global Leaderboards

- **Status**: Planned
- **Dependencies**: Part 6.
- **Deliverables**:
  - User authentication (guest anonymous session upgrade to permanent accounts).
  - Daily mode global and friend leaderboards.
  - Percentile ranking calculations.
- **Completion Criteria**:
  - Authenticated players retain history across devices; global leaderboard accurately displays top performers.

---

### Part 8 — Production Hardening, E2E Testing & Launch

- **Status**: Planned
- **Dependencies**: Part 7.
- **Deliverables**:
  - Full Playwright end-to-end test suite simulating complete game loops.
  - Accessibility audit (WCAG 2.1 AA compliance, keyboard navigation, screen reader test).
  - Lighthouse performance optimization (>95 across all metrics).
  - CI/CD automated test pipeline and deployment configuration.
- **Completion Criteria**:
  - All E2E tests pass reliably in CI; production build deployed and verified.
