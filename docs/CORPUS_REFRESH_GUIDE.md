# Flipped — Corpus Refresh & Maintenance Guide

This guide details the procedure for updating, expanding, and auditing the Flipped puzzle corpus and difficulty engine.

---

## 1. Architecture Overview

The corpus pipeline is completely offline, deterministic, and idempotent. It operates backwards from valid two-word phrases to generate all valid clue permutations:

```mermaid
flowchart TD
    Phrases[Seed Phrases (scripts/corpus/phrases-data.ts)] --> Generator[Generator (generator.ts)]
    Lexicon[Lexicon Database (lexicon-data.ts)] --> Generator
    Generator --> Raw[>= 10,000 Raw Candidates (All 4 Permutations)]
    Raw --> Validator[Quality Validator (validator.ts)]
    Validator --> Rejected[Rejected Pool (Rejection Breakdown)]
    Validator --> ReviewQueue[Review Queue (review-queue.json / .csv)]
    Validator --> Approved[Approved Pool (Quality Score >= 80)]
    Approved --> Difficulty[Difficulty Engine (difficulty.ts)]
    Difficulty --> Stratified[Stratified Selection (EASY, MEDIUM, HARD)]
    Legacy[Legacy Curated Puzzles (legacy-curated-puzzles.ts)] --> Assembly[Master Corpus Assembly]
    Stratified --> Assembly
    Assembly --> CorpusJson[src/features/game/data/puzzles-corpus.json]
    Assembly --> PublicJson[src/features/game/data/public-puzzles.json]
    Assembly --> Stats[data/corpus/corpus-stats.json & CORPUS_STATISTICS.md]
```

---

## 2. Running the Pipeline

To rebuild the corpus from scratch:

```bash
npm run corpus:build
```

This command triggers `node --experimental-strip-types scripts/corpus/build.ts` and will:

1. Synthesize all 4 permutations: `(SYN, SYN)`, `(ANT, ANT)`, `(SYN, ANT)`, and `(ANT, SYN)`.
2. Apply strict quality gates (profanity blocklist, word-length bounds 3-8/3-9, non-circularity, identical clue rejection, vocabulary familiarity).
3. Compute multi-factor difficulty scores (Zipf familiarity, cognitive inversion load, word length factor).
4. Export borderline items to `data/corpus/review-queue.json` and `.csv`.
5. Assemble the final balanced corpus ($\ge 3,000$ puzzles), permanently anchoring the 20 legacy curated puzzles at indices 0-19.
6. Regenerate `puzzles-corpus.json`, `public-puzzles.json`, and `docs/CORPUS_STATISTICS.md`.

---

## 3. How to Add New Words and Phrases

### Adding New Lexical Entries

Edit `scripts/corpus/assemble_lexicon_and_phrases.js` to define new lemmas with:

- `pos`: `"adj"` | `"noun"` | `"verb"`
- `zipfFrequency`: logarithmic frequency from SUBTLEX-US ($1.0$ to $7.0$)
- `synonyms`: direct synonyms
- `antonyms`: direct antonyms
- `definition`: clear concise definition

Run `node scripts/corpus/assemble_lexicon_and_phrases.js` to update `lexicon-data.ts`.

### Adding New Two-Word Phrases

Add natural English collocations or compound nouns to `RAW_PHRASES` in `scripts/corpus/assemble_lexicon_and_phrases.js`. Ensure both words are present in the lexicon.

---

## 4. Review Queue Inspection & Editorial Workflow

Candidates flagged with borderline scores, long clue lengths, or potential polysemy are written to:

- `data/corpus/review-queue.json`
- `data/corpus/review-queue.csv`

Editors can open the CSV in Excel, Google Sheets, or any table editor. To approve or reject a candidate:

1. Review the clue-to-answer naturalness and directness.
2. If approved, add an entry with explicit override to `scripts/corpus/lexicon-data.ts` or `legacy-curated-puzzles.ts`.
3. If rejected, add offending lemmas to the blocklist in `scripts/corpus/validator.ts`.

---

## 5. Backwards Compatibility & Safety Rules

1. **Never alter historical puzzle IDs**: Puzzles `fast-food`, `war-cry`, `hot-spring`, etc. must always retain their canonical IDs and clues so player history and Daily calendar records remain valid.
2. **Never leak answers to client bundles**: Canonical answers and explanations must never be imported into client components (`public-puzzles.ts` must only contain safe public metadata).
3. **Verify all tests after refresh**:
   ```bash
   npm run typecheck
   npm run lint
   npm test
   npm run build
   ```
