import fs from "fs";
import path from "path";
import { CORPUS_PHRASES } from "./phrases-data.ts";
import { LEXICON_ENTRIES } from "./lexicon-data.ts";
import { generateCandidatePuzzles } from "./generator.ts";
import { validateCandidateCorpus } from "./validator.ts";
import { calculateCandidateDifficulty } from "./difficulty.ts";
import { exportReviewQueue } from "./review-queue.ts";
import { LEGACY_CURATED_PUZZLES } from "../../src/features/game/data/legacy-curated-puzzles.ts";
import type { CorpusStats, DifficultyScoreBreakdown, Puzzle, RawCandidate } from "./types";

export function buildCorpus(): {
  readonly masterCorpus: readonly Puzzle[];
  readonly stats: CorpusStats;
} {
  console.log("=== Flipped Puzzle Corpus & Difficulty Engine Pipeline ===");
  console.log(
    `Loaded ${CORPUS_PHRASES.length} seed phrases and ${Object.keys(LEXICON_ENTRIES).length} lexical entries.`
  );

  // Stage 1: Generate candidates backwards
  const rawCandidates = generateCandidatePuzzles(CORPUS_PHRASES, LEXICON_ENTRIES);
  console.log(
    `Generated ${rawCandidates.length} raw candidate combinations across all 4 permutations.`
  );

  if (rawCandidates.length < 10000) {
    throw new Error(
      `Scale target failed: generated ${rawCandidates.length} candidates, expected >= 10000.`
    );
  }

  // Stage 2: Quality validation
  const validationSummary = validateCandidateCorpus(rawCandidates, LEXICON_ENTRIES);
  console.log(`Validation results:`);
  console.log(`- Approved Candidates: ${validationSummary.approved.length}`);
  console.log(`- Flagged for Review: ${validationSummary.reviewQueue.length}`);
  console.log(`- Rejected: ${validationSummary.rejected.length}`);
  console.log(`Rejection reasons breakdown:`, validationSummary.rejectionStats);

  // Stage 3: Difficulty scoring & Stratification
  const scoredApproved: Array<{
    candidate: RawCandidate;
    difficulty: DifficultyScoreBreakdown;
  }> = [];

  const tierBuckets: Record<
    "EASY" | "MEDIUM" | "HARD",
    Array<{ candidate: RawCandidate; difficulty: DifficultyScoreBreakdown }>
  > = {
    EASY: [],
    MEDIUM: [],
    HARD: [],
  };

  const relationshipDistribution = {
    SYNONYM_SYNONYM: 0,
    ANTONYM_ANTONYM: 0,
    SYNONYM_ANTONYM: 0,
    ANTONYM_SYNONYM: 0,
  };

  for (const candidate of validationSummary.approved) {
    const diff = calculateCandidateDifficulty(candidate, LEXICON_ENTRIES);
    scoredApproved.push({ candidate, difficulty: diff });
    tierBuckets[diff.tier].push({ candidate, difficulty: diff });

    const rel1 = candidate.transformations[0]?.relationship;
    const rel2 = candidate.transformations[1]?.relationship;
    if (rel1 === "SYNONYM" && rel2 === "SYNONYM") relationshipDistribution.SYNONYM_SYNONYM++;
    else if (rel1 === "ANTONYM" && rel2 === "ANTONYM") relationshipDistribution.ANTONYM_ANTONYM++;
    else if (rel1 === "SYNONYM" && rel2 === "ANTONYM") relationshipDistribution.SYNONYM_ANTONYM++;
    else if (rel1 === "ANTONYM" && rel2 === "SYNONYM") relationshipDistribution.ANTONYM_SYNONYM++;
  }

  console.log(`Scored approved distribution across tiers:`);
  console.log(`- EASY: ${tierBuckets.EASY.length}`);
  console.log(`- MEDIUM: ${tierBuckets.MEDIUM.length}`);
  console.log(`- HARD: ${tierBuckets.HARD.length}`);

  // Stage 4: Export Review Queue
  const reviewQueueScored = validationSummary.reviewQueue.map((c) => ({
    validation: validationSummary.results.find((r) => r.candidate.id === c.id)!,
    difficulty: calculateCandidateDifficulty(c, LEXICON_ENTRIES),
  }));
  const queueResult = exportReviewQueue(reviewQueueScored);
  console.log(
    `Exported review queue (${queueResult.count} items) to ${queueResult.jsonPath} and ${queueResult.csvPath}`
  );

  // Stage 5: Assemble balanced master corpus
  // Preserve 20 legacy curated puzzles intact at the start
  const existingIds = new Set(LEGACY_CURATED_PUZZLES.map((p) => p.id));
  const masterCorpus: Puzzle[] = [...LEGACY_CURATED_PUZZLES];

  // Stratify balanced selection: up to 1000 EASY, 1600 MEDIUM, 1000 HARD
  const targetEasy = tierBuckets.EASY.slice(0, 1000);
  const targetMedium = tierBuckets.MEDIUM.slice(0, 1600);
  const targetHard = tierBuckets.HARD.slice(0, 1000);

  const selectedCandidates = [...targetEasy, ...targetMedium, ...targetHard];

  for (const { candidate, difficulty } of selectedCandidates) {
    if (existingIds.has(candidate.id)) {
      continue;
    }
    existingIds.add(candidate.id);

    const puzzle: Puzzle = {
      id: candidate.id,
      clueWords: [candidate.clueWords[0], candidate.clueWords[1]],
      answerWords: [candidate.answerWords[0], candidate.answerWords[1]],
      transformations: [
        {
          clueWord: candidate.transformations[0]!.clueWord,
          answerWord: candidate.transformations[0]!.answerWord,
          relationship: candidate.transformations[0]!.relationship,
          explanation: candidate.transformations[0]!.explanation,
        },
        {
          clueWord: candidate.transformations[1]!.clueWord,
          answerWord: candidate.transformations[1]!.answerWord,
          relationship: candidate.transformations[1]!.relationship,
          explanation: candidate.transformations[1]!.explanation,
        },
      ],
      difficulty: difficulty.tier,
      metadata: {
        hints: [
          `Phrase begins with ${candidate.answerWords[0].charAt(0)} and ${candidate.answerWords[1].charAt(0)}`,
          difficulty.reasoning,
        ],
      },
    };

    masterCorpus.push(puzzle);
  }

  console.log(`Final master corpus assembled: ${masterCorpus.length} total puzzles.`);
  if (masterCorpus.length < 3000) {
    throw new Error(
      `Target failed: master corpus has ${masterCorpus.length} puzzles, expected >= 3000.`
    );
  }

  // Count difficulty distribution in master corpus
  const corpusDifficulty = { EASY: 0, MEDIUM: 0, HARD: 0 };
  for (const p of masterCorpus) {
    corpusDifficulty[p.difficulty]++;
  }

  console.log(`Corpus difficulty distribution:`, corpusDifficulty);

  // Stage 6: Write files
  const corpusJsonPath = path.join("src", "features", "game", "data", "puzzles-corpus.json");
  fs.writeFileSync(corpusJsonPath, JSON.stringify(masterCorpus, null, 2), "utf-8");
  console.log(
    `Written server master corpus to ${corpusJsonPath} (${(fs.statSync(corpusJsonPath).size / 1024).toFixed(1)} KB)`
  );

  const publicMetadata = masterCorpus.map((p) => ({
    id: p.id,
    clueWords: [p.clueWords[0], p.clueWords[1]],
    difficulty: p.difficulty,
    wordLengths: [p.answerWords[0]?.length || 0, p.answerWords[1]?.length || 0],
  }));
  const publicJsonPath = path.join("src", "features", "game", "data", "public-puzzles.json");
  fs.writeFileSync(publicJsonPath, JSON.stringify(publicMetadata, null, 2), "utf-8");
  console.log(
    `Written public safe metadata to ${publicJsonPath} (${(fs.statSync(publicJsonPath).size / 1024).toFixed(1)} KB)`
  );

  const stats: CorpusStats = {
    totalPhrasesInput: CORPUS_PHRASES.length,
    totalCandidatesGenerated: rawCandidates.length,
    totalRejected: validationSummary.rejected.length,
    rejectionBreakdown: validationSummary.rejectionStats,
    totalReviewQueue: validationSummary.reviewQueue.length,
    totalApproved: masterCorpus.length,
    difficultyDistribution: corpusDifficulty,
    relationshipDistribution,
    generatedAt: new Date().toISOString(),
    version: "2.0.0",
  };

  const statsJsonPath = path.join("data", "corpus", "corpus-stats.json");
  fs.writeFileSync(statsJsonPath, JSON.stringify(stats, null, 2), "utf-8");

  // Stage 7: Generate Markdown Report
  const mdReport = `# Flipped Puzzle Corpus & Difficulty Engine Report

## 1. Executive Summary

- **Pipeline Version**: ${stats.version}
- **Generated At**: ${stats.generatedAt}
- **Total Input Phrases**: ${stats.totalPhrasesInput}
- **Total Raw Candidates Generated**: **${stats.totalCandidatesGenerated.toLocaleString()}** (Target: $\\ge 10,000$)
- **Total Quality-Approved Puzzles in Corpus**: **${stats.totalApproved.toLocaleString()}** (Target: $\\ge 3,000$)
- **Total Flagged for Editorial Review Queue**: **${stats.totalReviewQueue.toLocaleString()}**
- **Total Filtered Rejections**: **${stats.totalRejected.toLocaleString()}**

---

## 2. Difficulty Distribution

The difficulty formula incorporates SUBTLEX-US Zipf familiarity scores, cognitive inversion weights (+12 points per antonym), and word length factors:

| Tier | Puzzles Count | Percentage of Corpus | Characteristics |
| :--- | :--- | :--- | :--- |
| **EASY** | **${corpusDifficulty.EASY.toLocaleString()}** | **${((corpusDifficulty.EASY / stats.totalApproved) * 100).toFixed(1)}%** | High familiarity vocabulary (Zipf $\\ge 4.8$), 3-5 letter words, direct transformations |
| **MEDIUM** | **${corpusDifficulty.MEDIUM.toLocaleString()}** | **${((corpusDifficulty.MEDIUM / stats.totalApproved) * 100).toFixed(1)}%** | Standard vocabulary, single antonym inversion, standard word lengths |
| **HARD** | **${corpusDifficulty.HARD.toLocaleString()}** | **${((corpusDifficulty.HARD / stats.totalApproved) * 100).toFixed(1)}%** | Dual antonym inversions, longer letter lengths (6-8 chars), subtle vocabulary |
| **TOTAL** | **${stats.totalApproved.toLocaleString()}** | **100.0%** | Comprehensive balance across all gameplay modes |

---

## 3. Relationship Permutation Distribution

Every candidate was synthesized backwards across all 4 relationship permutations:

- **SYNONYM / SYNONYM**: ${relationshipDistribution.SYNONYM_SYNONYM.toLocaleString()} candidates
- **ANTONYM / ANTONYM**: ${relationshipDistribution.ANTONYM_ANTONYM.toLocaleString()} candidates
- **SYNONYM / ANTONYM**: ${relationshipDistribution.SYNONYM_ANTONYM.toLocaleString()} candidates
- **ANTONYM / SYNONYM**: ${relationshipDistribution.ANTONYM_SYNONYM.toLocaleString()} candidates

---

## 4. Quality Filter Rejections Breakdown

Candidates were automatically filtered through strict quality and decency gates:

| Rejection Reason | Count | Explanation |
| :--- | :--- | :--- |
| \`PROFANITY_DETECTED\` | ${stats.rejectionBreakdown.PROFANITY_DETECTED || 0} | Blocklisted profanity or explicit terms |
| \`INVALID_WORD_LENGTH\` | ${stats.rejectionBreakdown.INVALID_WORD_LENGTH || 0} | Words outside 3-8 (answer) or 3-9 (clue) character boundaries |
| \`CIRCULAR_RELATIONSHIP\` | ${stats.rejectionBreakdown.CIRCULAR_RELATIONSHIP || 0} | Clue identical to answer or cross-matching other answer |
| \`IDENTICAL_CLUES\` | ${stats.rejectionBreakdown.IDENTICAL_CLUES || 0} | Both clue words are identical (\`clue1 === clue2\`) |
| \`OBSCURE_VOCABULARY\` | ${stats.rejectionBreakdown.OBSCURE_VOCABULARY || 0} | Ultra-rare words with Zipf score < 2.5 |
| \`DUPLICATE_PUZZLE_ID\` | ${stats.rejectionBreakdown.DUPLICATE_PUZZLE_ID || 0} | Duplicate quartet combination |

---

## 5. Review Queue & Human Inspection

Candidates flagged with borderline quality scores, long clue lengths, or extreme difficulty have been exported to:
- \`data/corpus/review-queue.json\` (${stats.totalReviewQueue} items)
- \`data/corpus/review-queue.csv\` (${stats.totalReviewQueue} items)

Human editors can inspect this queue to approve, reject, or adjust difficulty tiers with complete provenance.

---

## 6. Backwards Compatibility & Security Guarantees

1. **Curated Preservation**: The original 20 hand-crafted puzzles (\`fast-food\`, \`war-cry\`, etc.) remain at the beginning of the corpus with their original IDs and published Daily assignments intact.
2. **Zero Answer Leakage**: Full puzzle answers and transformations are strictly confined to server-side assets (\`src/features/game/data/puzzles-corpus.json\`). Client presentation components only import safe metadata (\`src/features/game/data/public-puzzles.ts\`).
`;

  const mdPath = path.join("docs", "CORPUS_STATISTICS.md");
  fs.mkdirSync(path.dirname(mdPath), { recursive: true });
  fs.writeFileSync(mdPath, mdReport, "utf-8");
  console.log(`Written corpus statistics report to ${mdPath}`);

  return { masterCorpus, stats };
}

// Execute if run directly
buildCorpus();
