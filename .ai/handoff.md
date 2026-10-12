# Flipped — Session Handoff (Part 5 -> Part 6)

## 1. What Exists Today

- **Game Modes & Scheduling Architecture (`src/features/game/modes/`)**:
  - `mode-types.ts`: typed domain contracts for `GameMode`, `DailyPuzzleAssignment`, `DailyAttemptRecord`, `ClassicHistoryRecord`, `DailyPuzzleResult`, `RoundConfiguration`.
  - `daily-scheduler.ts`: deterministic `getDailyDateString` using `Asia/Kolkata` (IST) reference timezone, returning strict `YYYY-MM-DD` identifiers; `getDailyPuzzle` returning `AVAILABLE`, `FUTURE_UNPUBLISHED`, or `UNAVAILABLE`; `getPublishedDailySchedule`.
  - `classic-selector.ts`: `selectClassicPuzzle` with strict difficulty filtering, recent ID exclusion, and exhausted pool wrapping without immediate repetition.
  - `round-configuration.ts`: `createDailyRoundConfiguration` and `createClassicRoundConfiguration`.

- **Persistence Adapter (`src/features/game/persistence/local-progress.ts`)**:
  - Versioned storage schema `flipped_progress_v1` tracking Daily attempt records and Classic history (`recentlyPlayedIds`, `totalPlayed`, `totalWins`, `lastDifficulty`).
  - Safe parsing with automatic fallback on corruption, plus in-memory fallback for SSR and restricted private browsing environments.
  - Single-attempt daily lock: both `WON` and `TIMED_OUT` persist records, locking scored re-attempts on that calendar date.

- **Presentation & Dedicated Routes (`src/app/`, `src/features/game/components/`)**:
  - `DifficultySelector.tsx`: interactive radio cards for Easy, Medium, and Hard tiers.
  - `DailyCompletionCard.tsx`: read-only review of completed daily puzzles, preserving score, elapsed time, hints, explanations, and solved letter grid.
  - `SuccessScreen.tsx` & `TimeoutScreen.tsx`: mode-aware outcome actions (Daily locked vs Classic replay).
  - `GameBoard.tsx`: mode-aware orchestration, persisting attempts upon completion.
  - `src/app/page.tsx`: production home screen with active Daily and Classic launch cards, archive link, and rules overview.
  - `src/app/daily/page.tsx`: functional Daily challenge flow enforcing the single-attempt lock.
  - `src/app/classic/page.tsx`: functional Classic mode with tier picker, repetition-minimized sequencing, and live win rate tracking.
  - `src/app/archive/page.tsx`: Daily archive listing past calendar challenges and player completion status.

- **Verification Metrics**:
  - **145 / 145 unit and component tests passing** across 18 test suites in ~1.5s (`npm run test`).
  - Zero TypeScript compiler errors (`npm run typecheck`).
  - Zero ESLint errors or warnings (`npm run lint`).
  - Clean Prettier formatting (`npm run format:check`).
  - Successful Next.js production build with static prerendering (`npm run build`).

---

## 2. What Part 6 Must Implement

In **Part 6 — Backend Architecture, PostgreSQL Database Integration & User Accounts**, the engineer will build:

1. **PostgreSQL Database Schema & Migrations**:
   - Schema for users, daily puzzles, puzzle bank, attempt records, and leaderboards.
   - Database connection management with connection pooling.

2. **Authentication & User Identity**:
   - Player account creation / guest-to-registered migration.
   - Secure session handling.

3. **Server-Authoritative Daily Results & Sync**:
   - Server endpoints to validate and record daily attempts.
   - Sync local storage progress to authenticated user profiles.

4. **Competitive Global Leaderboards**:
   - Daily challenge leaderboard rankings by score and solve speed.
   - Streak tracking across calendar days.
