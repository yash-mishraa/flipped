# Flipped — Product Design & Vision

## 1. Product Vision

**Flipped** is a premium, distraction-free word puzzle game crafted for analytical minds and word enthusiasts. Inspired by modern minimalist puzzle games, Flipped delivers a tactile, highly responsive, and intellectually satisfying word deduction experience.

The game is designed with a bespoke physical feel: letters flip, shift, and lock into place smoothly with elegant typography, off-white paper-like backgrounds, charcoal typography, and subtle coral accent cues.

---

## 2. Core Gameplay Concept & Key Interaction Paradigm

### The Central Grid Paradigm

Unlike conventional word games that rely on standard text input boxes, keyboards with separate "Submit" buttons, or disjointed guess lists:

- **Central interaction is an editable letter grid with automatic answer detection.**
- Players interact directly with the cells on the grid (via keyboard navigation, click-to-focus, or direct cell editing).
- When a valid row or target sequence is completely filled with valid letters forming an acceptable word, the engine **automatically detects and validates the answer**.
- There is **no conventional Submit button**. The game flow is continuous, responsive, and reactive, minimizing cognitive friction and interface clutter.

### Letter States & Visual Feedback

As words are evaluated, individual cells transition through clear tactile states:

1. **Empty / Idle**: Neutral, waiting for input.
2. **Editing / Active**: Highlighted focus ring, ready for letter entry or replacement.
3. **Correct (Locked / Flipped)**: Correct letter in the exact correct position.
4. **Misplaced (Shifted)**: Letter exists in the target word but belongs in a different position.
5. **Incorrect (Absent)**: Letter does not exist in the target word.

---

## 3. Game Modes

### A. Daily Mode

- **Universal Synchronization**: A single canonical puzzle generated or scheduled per UTC calendar day.
- **Equal Constraints**: All players worldwide receive the identical starting layout and target word constraints.
- **Streak & Performance Tracking**: Players get one official attempt per day. Solves and attempt counts contribute to ongoing player streaks and percentile statistics.
- **Server-Authoritative Validation**: In later backend stages, Daily challenge seeds and results are verified against a secure server endpoint to ensure leaderboard integrity.

### B. Classic Mode

- **On-Demand & Unlimited**: Unlimited procedural or seeded puzzle gameplay without time locks or 24-hour restrictions.
- **Skill Progression**: Selectable difficulty tiers (e.g., word lengths, attempt limits, hint density).
- **Practice & Experimentation**: Immediate restart, undo/reset options, and rapid feedback for players honing their word deduction strategies.

---

## 4. Target Experience & UX Principles

1. **Tactile Minimalism**: Focus on typography, spacious layouts, and subtle motion. No distracting banners, aggressive popups, or unnecessary gamification noise.
2. **Immediate Feedback**: Instant visual cues on valid word formations and automatic detection without modal prompts.
3. **Keyboard & Touch Parity**: Complete keyboard navigation (arrow keys, Backspace, letter typing) paired seamlessly with tap-to-select mobile touch targets.
4. **Resilient Offline/Reconnection Behavior**: State snapshots persist locally so players never lose progress on accidental page reloads.
5. **Accessibility**: High-contrast states, screen-reader friendly ARIA cell roles (`aria-label`, `aria-live` region announcements), and full keyboard tab-indexing.

---

## 5. Essential Design Constraints

- **Decoupled Architecture**: Puzzle mechanics, board evaluations, and letter-state computations must reside in pure, testable TypeScript engine modules without React dependencies.
- **Typed State Snapshot Model**: Game state must be serializable and immutable, represented as explicit typed snapshots (`GameStateSnapshot`).
- **No Mock Functionality**: Every stage must ship real, working code. Placeholders or non-functional fake UI (fake streak counters, fake timers, dead buttons) are strictly prohibited.

---

## 6. Formal Puzzle Engine Rules & Elimination Model (Part 2)

### Semantic Phrase Transformations

Every puzzle specifies two clue words and two canonical answer words:

- Each word undergoes an explicit semantic transformation: `SYNONYM` or `ANTONYM`.
- A human-readable explanation describes the relationship.
- Clue/Answer lengths define the exact letter grid geometry.

### Letter Tile State Engine

Each word's first letter tile is permanently revealed and marked `isFixed = true` (`CONFIRMED`).
All remaining tiles start empty and editable:

1. `CONFIRMED`: Letter verified at the exact required position (or fixed clue letter).
2. `PENDING`: Letter exists in the target word with remaining unmatched frequency, but is currently in the wrong position.
3. `ELIMINATED`: Letter does not exist in the target word, or all occurrences are already accounted for.
4. `NONE`: Empty tile awaiting player entry.

### Multi-Occurrence Elimination Rule

Letter frequency in the target word is strictly tracked:

- Exact positional matches take first priority and consume letter instances from the target pool.
- Remaining entries that match available target letters are marked `PENDING` (not eliminated).
- Excess entries of a letter beyond its total target frequency are marked `ELIMINATED`.
- Any incorrect tile (`PENDING` or `ELIMINATED`) remains fully editable by the player until solved or timed out.

### Scoring Formula

$$\text{score} = \max(0, \min(100, 100 - \lfloor\text{elapsedSeconds} / 5\rfloor - (\text{hintsUsed} \times 5)))$$

- Base score: 100 points.
- Time penalty: 1 point per complete 5 seconds.
- Hint penalty: 5 points per hint used.
- Score is bounded between 0 and 100.

### Deterministic Hint Policy

Reading-order scan (Word 0 left-to-right, then Word 1 left-to-right). Selects the first tile that is neither fixed nor already solved with the correct letter.

---

## 7. Interactive Grid Controls & Multi-Modal Accessibility (Part 3)

### Multi-Modal Letter Feedback

To guarantee readability for players with color vision deficiencies, letter tiles never rely solely on color cues:

- **`FIXED` (Permanent Clue Letter)**: Slate background, lock badge (`<Lock className="w-2.5 h-2.5" />`), bold typography, non-interactive cursor.
- **`CONFIRMED` (Correct Letter & Position)**: Emerald green background, solid green border, checkmark badge (`<Check className="w-2.5 h-2.5" />`).
- **`PENDING` (Misplaced / Valid Target Frequency)**: Amber background, solid amber border, bold amber text.
- **`ELIMINATED` (Letter Absent or Frequency Exhausted)**: Dimmed stone background, diagonal slash badge (`<Slash className="w-2.5 h-2.5" />`), line-through text style.
- **`NONE` (Empty Slot)**: Off-white background, subtle dashed border, active focus ring when selected.

### Keyboard & Touch Navigation Paradigm

1. **Roving Selection**: Clicking or tapping any editable tile selects it. Fixed tiles reject selection.
2. **Auto-Advance**: Typing a letter fills the selected slot and automatically moves the cursor to the next editable tile across word boundaries.
3. **Smart Backspace**:
   - If the current tile has a letter, Backspace clears it and remains on the tile.
   - If the current tile is empty, Backspace moves to the previous editable tile and clears it.
4. **Directional Roving**: Arrow keys (`ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`), `Home`, and `End` traverse editable slots across words.
5. **Mobile Focus Buffer**: An off-screen input buffer maintains focus state, summoning mobile virtual keyboards without interfering with layout zoom or scrolling.

---

## 8. 60-Second Timed Round Loop, Scoring & Result Screens (Part 4)

### Lifecycle State Machine & Terminal Transitions

The round follows a strict, irreversible state progression:

- `READY`: Game begins here. Clues and fixed clue letters are displayed. Editable letter tiles are locked/inactive. The countdown displays `01:00`. The prominent "Start Game (60s)" button initiates the round.
- `PLAYING`: Timer counts down from 60 seconds. Editable tiles unlock. Input, backspace, navigation, and hints are enabled. Scoring clock updates dynamically.
- `WON`: Automatically triggered when all answer letters are entered correctly before the deadline. Timer stops immediately. Board is preserved. Final score is frozen.
- `TIMED_OUT`: Automatically triggered when the countdown reaches 0 (`00:00`). Timer stops. Grid and hints are disabled. Board is preserved.

### Drift-Free Deadline Timer Architecture

- Rather than decrementing an integer accumulator with drift, the timer measures elapsed time against an authoritative deadline: $\text{deadline} = \text{startTime} + 60\,000\,\text{ms}$.
- Periodic updates recalculate $\text{remaining} = \max(0, \text{deadline} - \text{Date.now()})$ and display whole seconds via $\lceil\text{remaining} / 1000\rceil$.
- **Background Tabs**: Tab suspension is detected via the document `visibilitychange` event. When returning, remaining time is recalculated instantly from wall-clock time; backgrounding grants zero extra time.
- **Urgency Tiers**:
  - `normal`: > 20s remaining.
  - `urgent`: 11–20s remaining (amber warning cue).
  - `critical`: 1–10s remaining (coral alert with pulse animation, respecting `prefers-reduced-motion`).
  - `expired`: 0s remaining (`00:00`).

### Authoritative Deadline & Race-Condition Policy

- An answer submission is valid **only if processed before the authoritative deadline**.
- If a letter entry or hint request occurs at or after the deadline ($\text{Date.now()} \ge \text{deadline}$), the round transitions atomically to `TIMED_OUT`. A late letter event cannot award a win.
- Both `WON` and `TIMED_OUT` are strictly terminal; once reached, no subsequent callback, user input, or timer event can alter the result.

### Scoring Policy & Timeout Distinction

- **Active / Winning Rounds**: Score updates dynamically every 5 elapsed seconds and upon hint usage:
  $$\text{score} = \max(0, \min(100, 100 - \lfloor\text{elapsedSeconds} / 5\rfloor - (\text{hintsUsed} \times 5)))$$
- **Timeout Policy**: Unsolved rounds that expire at 60 seconds do **not** award completion points (official score is **0**). To encourage player development, the timeout screen displays a clearly labeled **Potential Practice Score** (e.g., 88) alongside an explanation that unfinished rounds officially score 0.

### Result Screens & Replay Mechanics

- **Success Screen (`SuccessScreen`)**:
  - Displays celebratory trophy badge, solved answer phrase, and full semantic transformation explanations.
  - Summarizes final frozen score, elapsed seconds, and hints used.
  - Offers "Play Again" button and "Home" link.
- **Timeout Screen (`TimeoutScreen`)**:
  - Displays encouraging time-expired header, reveals the correct canonical answer phrase, and explains both semantic transformations.
  - Displays time limit reached (60s), hints used, and potential practice score.
  - Offers "Play Again" button and "Home" link.
- **Play Again Action**:
  - Generates a fresh unique `roundId`.
  - Resets state back to `READY`, clears player entries, restores initial clue letters, resets timer to `01:00`, resets hints to 0, score to 100, and clears all scheduled callbacks.

---

## 9. Daily & Classic Game Modes, Calendar Scheduling & Local Persistence (Part 5)

### Daily Challenge Mechanics (`/daily`)

- **Deterministic Assignment**: Deterministically maps the calendar day string (`YYYY-MM-DD`) using the `Asia/Kolkata` reference timezone to a curated master puzzle.
- **Single-Attempt Enforcement**:
  - Only one official attempt is permitted per calendar date.
  - Both `WON` and `TIMED_OUT` outcomes consume the daily attempt and persist a `DailyAttemptRecord`.
  - Completed daily puzzles render in read-only review mode via `DailyCompletionCard`, locking further scored attempts.
  - Result screens for Daily mode direct players to Classic mode or the Daily Archive.
- **Archive Navigation (`/archive`)**:
  - Lists published historical daily puzzles chronologically.
  - Displays user solving status (`Solved (XXX pts)`, `Timed Out`, or `Unplayed`).
  - Provides direct access to play or review today's challenge.

### Classic Mode Mechanics (`/classic`)

- **Difficulty Tiers**: Easy, Medium, and Hard tiers selectable via interactive `DifficultySelector` radio cards.
- **Repetition-Free Selection**:
  - Filters curated puzzle bank strictly by requested difficulty.
  - Excludes the last $N$ played puzzle IDs (`recentlyPlayedIds`).
  - Gracefully wraps when the difficulty pool is exhausted while avoiding immediate repetition of the previous puzzle.
- **Unlimited Replay**: Players can skip or play subsequent puzzles indefinitely via "Next Classic Puzzle".
- **Local Progress Metrics**: Tracks total games played, total wins, win percentage, and last selected difficulty.

### Local Storage Architecture (`src/features/game/persistence/local-progress.ts`)

- **Key**: `flipped_progress_v1`
- **Schema**:
  - `version: 1`
  - `daily`: Record of date strings (`YYYY-MM-DD`) mapped to `DailyAttemptRecord`
  - `classic`: `recentlyPlayedIds`, `lastDifficulty`, `totalPlayed`, `totalWins`
- **Resilience**: Safe JSON parse with automatic rollback to defaults on corruption, and in-memory store fallback for SSR and restricted private browsing environments.

---

## 10. Backend Architecture, Database Persistence & Secure Game Infrastructure (Part 6)

### Security Boundaries & Zero Answer Leakage

In competitive word games, exposing target solutions in frontend props or network payloads allows players to inspect answers via DevTools. Part 6 enforces strict server-authoritative security boundaries:

- **Active Round Isolation (`SafeGameplayPayload`)**: When an attempt starts, the client receives only:
  - `attemptId`, `mode`, `status: "IN_PROGRESS"`, `startedAt`, `deadline` (timestamp ms)
  - `clueWords`: Array of clue words
  - `wordLengths`: Tuple of target word lengths (e.g. `[4, 4]`)
  - `firstLetters`: Initial revealed clue letters (e.g. `["F", "F"]`)
  - `transformations`: Array of clue transformations displaying transformation type and explanation, but with target answer words omitted.
- **Canonical Answers Kept Server-Side**: Canonical answers, approved variants, and transformation target words remain exclusively on the server in database storage.
- **Terminal Reveal Only (`FinalizedResultPayload`)**: Full answer words, variants, and transformation explanations are returned only after the attempt has reached a terminal state (`WON` or `TIMED_OUT`). Active attempts requesting results receive HTTP 403 Forbidden.

### Server-Authoritative Clock & Attempt Lifecycle

Client-supplied timers, scores, and status flags are strictly untrusted:

1. **Attempt Initiation (`/api/game/daily/start`, `/api/game/classic/start`)**:
   - Computes authoritative `startedAt = Date.now()` and `deadline = startedAt + 60,000ms`.
   - Persists the attempt in PostgreSQL / memory store.
   - For Daily mode, resolves the date via `Asia/Kolkata` timezone and checks for existing attempts. If an attempt is active, returns the existing attempt; if completed, returns the finalized result.
2. **Authoritative Submission (`/api/game/attempt/[id]/submit`)**:
   - Accepts player candidate phrase.
   - Evaluates elapsed time against authoritative server `deadline`.
   - If submitted at or after deadline ($\text{now} \ge \text{deadline}$), marks attempt `TIMED_OUT` with score 0.
   - Validates candidate phrase against canonical solution and approved variants using `areAnswersEquivalent`.
   - If correct and before deadline: marks attempt `WON`, calculates score via $\max(0, \min(100, 100 - \lfloor\text{elapsed}/5\rfloor - 5\times\text{hints}))$, and seals the record atomically.
3. **Atomic Timeout Finalization (`/api/game/attempt/[id]/timeout`)**:
   - Atomically transitions active attempts that expired to `TIMED_OUT` with score 0.
4. **Authoritative Hint Delivery (`/api/game/attempt/[id]/hint`)**:
   - Enforces active status and deadline validity.
   - Finds the next non-revealed tile in reading order.
   - Increments server-tracked `hintsUsed` and deducts 5 points.
   - Dispatches only `{ wordIndex, letterIndex, letter, hintsUsed, remainingHints }` without leaking the rest of the target phrase.

### Signed Guest Identity & Anti-Cheating

- **Guest Session Token**: Cryptographically signed cookie (`guestId.timestamp.hmac`) generated using Node.js `crypto.createHmac("sha256", secret)`.
- **Constant-Time Verification**: Uses `crypto.timingSafeEqual` to prevent timing attacks.
- **Cookie Directives**: Stored in `flipped_guest_session` with `httpOnly: true`, `sameSite: "lax"`, `secure: process.env.NODE_ENV === "production"`, `maxAge: 365 days`.
- **Sliding-Window Rate Limiting**: In-memory rate limiter tracks IP/guest request bursts, mitigating brute-force answer discovery attacks.

### Relational Schema & Persistence Layer

- **Prisma Schema (`prisma/schema.prisma`)**:
  - `Puzzle`: Unique ID, clue words, answer words, transformations, difficulty, approved variants.
  - `DailyAssignment`: Calendar date (`YYYY-MM-DD`), puzzle relation, publish timestamp.
  - `GuestProfile`: Unique guest ID, creation timestamp, last active timestamp.
  - `GameAttempt`: Primary key UUID, guest relation, puzzle relation, mode enum (`DAILY` | `CLASSIC`), status enum (`IN_PROGRESS` | `WON` | `TIMED_OUT`), `startedAt`, `deadline`, `finishedAt`, `score`, `elapsedSeconds`, `hintsUsed`, `dailyDate`.
  - Composite Unique Constraint: `@@unique([guestId, dailyDate])` prevents race conditions or multi-tab exploits on Daily challenges.
- **Fallback Architecture**: `src/server/db/client.ts` implements `InMemoryDatabase` alongside `PrismaClient`. Development, test runs, and static builds run seamlessly without requiring a running PostgreSQL service.
