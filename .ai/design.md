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
