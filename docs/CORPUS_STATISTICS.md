# Flipped Puzzle Corpus & Difficulty Engine Report

## 1. Executive Summary

- **Pipeline Version**: 2.0.0
- **Generated At**: 2026-10-28T06:57:50.973Z
- **Total Input Phrases**: 1228
- **Total Raw Candidates Generated**: **85,928** (Target: $\ge 10,000$)
- **Total Quality-Approved Puzzles in Corpus**: **3,630** (Target: $\ge 3,000$)
- **Total Flagged for Editorial Review Queue**: **37,378**
- **Total Filtered Rejections**: **4,237**

---

## 2. Difficulty Distribution

The difficulty formula incorporates SUBTLEX-US Zipf familiarity scores, cognitive inversion weights (+12 points per antonym), and word length factors:

| Tier | Puzzles Count | Percentage of Corpus | Characteristics |
| :--- | :--- | :--- | :--- |
| **EASY** | **1,010** | **27.8%** | High familiarity vocabulary (Zipf $\ge 4.8$), 3-5 letter words, direct transformations |
| **MEDIUM** | **1,610** | **44.4%** | Standard vocabulary, single antonym inversion, standard word lengths |
| **HARD** | **1,010** | **27.8%** | Dual antonym inversions, longer letter lengths (6-8 chars), subtle vocabulary |
| **TOTAL** | **3,630** | **100.0%** | Comprehensive balance across all gameplay modes |

---

## 3. Relationship Permutation Distribution

Every candidate was synthesized backwards across all 4 relationship permutations:

- **SYNONYM / SYNONYM**: 16,370 candidates
- **ANTONYM / ANTONYM**: 5,919 candidates
- **SYNONYM / ANTONYM**: 7,318 candidates
- **ANTONYM / SYNONYM**: 14,706 candidates

---

## 4. Quality Filter Rejections Breakdown

Candidates were automatically filtered through strict quality and decency gates:

| Rejection Reason | Count | Explanation |
| :--- | :--- | :--- |
| `PROFANITY_DETECTED` | 0 | Blocklisted profanity or explicit terms |
| `INVALID_WORD_LENGTH` | 3621 | Words outside 3-8 (answer) or 3-9 (clue) character boundaries |
| `CIRCULAR_RELATIONSHIP` | 413 | Clue identical to answer or cross-matching other answer |
| `IDENTICAL_CLUES` | 89 | Both clue words are identical (`clue1 === clue2`) |
| `OBSCURE_VOCABULARY` | 0 | Ultra-rare words with Zipf score < 2.5 |
| `DUPLICATE_PUZZLE_ID` | 17 | Duplicate quartet combination |

---

## 5. Review Queue & Human Inspection

Candidates flagged with borderline quality scores, long clue lengths, or extreme difficulty have been exported to:
- `data/corpus/review-queue.json` (37378 items)
- `data/corpus/review-queue.csv` (37378 items)

Human editors can inspect this queue to approve, reject, or adjust difficulty tiers with complete provenance.

---

## 6. Backwards Compatibility & Security Guarantees

1. **Curated Preservation**: The original 20 hand-crafted puzzles (`fast-food`, `war-cry`, etc.) remain at the beginning of the corpus with their original IDs and published Daily assignments intact.
2. **Zero Answer Leakage**: Full puzzle answers and transformations are strictly confined to server-side assets (`src/features/game/data/puzzles-corpus.json`). Client presentation components only import safe metadata (`src/features/game/data/public-puzzles.ts`).
