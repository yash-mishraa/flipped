# Flipped Puzzle Corpus — Source & License Manifest

This document records the lexical resources, word frequency databases, licenses, attribution notices, and acquisition methods utilized in constructing the expanded puzzle corpus and difficulty engine for **Flipped**.

---

## 1. Summary of Lexical Sources

| Resource                      | Version      | License                         | Primary Purpose                                                                          | Acquisition Method                                                          |
| :---------------------------- | :----------- | :------------------------------ | :--------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------- |
| **Princeton WordNet**         | 3.1          | BSD-style (WordNet 3.0 License) | Core synsets, lexical antonym/synonym pairs, POS classifications, and definitions        | Curated offline compilation from WordNet 3.1 synset database                |
| **Open English WordNet**      | 2024 Edition | CC-BY 4.0                       | Modern colloquial vocabulary, contemporary compound words, and additional semantic links | Curated offline dataset export                                              |
| **wordfreq / SUBTLEX-US**     | v3.0         | CC-BY-SA 4.0                    | Objective vocabulary familiarity estimates (Zipf log-frequency scale 1.0 to 7.0)         | Offline frequency mapping tables                                            |
| **Flipped Phrase Dictionary** | v2.0         | MIT License                     | High-frequency two-word collocations, idioms, and compound nouns                         | Domain-curated seed phrases filtered for naturalness and grid compatibility |

---

## 2. Detailed License & Attribution Declarations

### 1. Princeton WordNet 3.1

- **Copyright**: Copyright 2011 by Princeton University. All rights reserved.
- **License**: WordNet 3.0 License (BSD-style permissive license).
- **URL**: [https://wordnet.princeton.edu/license-and-commercial-use](https://wordnet.princeton.edu/license-and-commercial-use)
- **Attribution Notice**:
  > WordNet Release 3.1. Copyright 2011 by Princeton University. All rights reserved. THIS SOFTWARE AND DATABASE IS PROVIDED "AS IS" AND PRINCETON UNIVERSITY MAKES NO REPRESENTATIONS OR WARRANTIES, EXPRESS OR IMPLIED.
- **Usage in Flipped**: Direct lexical linkages between lemmas, part-of-speech mappings (adjectives, nouns, verbs), synset definitions, and directional antonym/synonym relationships.

---

### 2. Open English WordNet

- **Authors**: John P. McCrae, Michael Fell et al., Global WordNet Association.
- **License**: Creative Commons Attribution 4.0 International (CC-BY 4.0).
- **URL**: [https://en-word.net/license](https://en-word.net/license)
- **Attribution Notice**:
  > Open English WordNet by John P. McCrae, Michael Fell, et al., Global WordNet Association. Available under CC-BY 4.0.
- **Usage in Flipped**: Supplementing WordNet 3.1 with contemporary phrases, modernized adjectives, and colloquial two-word collocations.

---

### 3. wordfreq / SUBTLEX-US Word Frequency Dataset

- **Author**: Robyn Speer (Luminoso Technologies) based on SUBTLEX-US, Google Books, and Wikipedia.
- **License**: Creative Commons Attribution-ShareAlike 4.0 International (CC-BY-SA 4.0).
- **URL**: [https://github.com/rspeer/wordfreq](https://github.com/rspeer/wordfreq)
- **Attribution Notice**:
  > wordfreq by Robyn Speer. SUBTLEX-US frequency corpus compiled by Marc Brysbaert and Boris New. Licensed under CC-BY-SA 4.0.
- **Usage in Flipped**: Logarithmic Zipf frequency ratings ($Zipf \in [1.0, 7.0]$) used by `scripts/corpus/difficulty.ts` to compute clue and answer familiarity scores without biased human guesswork.

---

### 4. Flipped Curated Collocations & Phrases Dictionary

- **Curator**: Flipped Project Core Team.
- **License**: MIT License.
- **Usage in Flipped**: Verified two-word English phrases used as the backwards generation anchor in `scripts/corpus/generator.ts`.

---

## 3. Strict Compliance Directives

1. **Deterministic Offline Pipeline**: All lexical relationships, definitions, and frequency metrics are stored in repository assets (`scripts/corpus/lexicon-data.ts` and `scripts/corpus/phrases-data.ts`). **Zero runtime third-party API calls** occur during gameplay or CI builds.
2. **Zero Client Bundle Answer Leakage**: Full solutions, transformations, and approved variants are strictly stored server-side (`src/features/game/data/puzzles-corpus.json`). Only public safe metadata (`src/features/game/data/public-puzzles.json`) is accessible to client components.
3. **Permanent Legacy Preservation**: Historical seed puzzles (`fast-food`, `war-cry`, etc.) remain permanent anchors at indices 0-19 to ensure past Daily challenges never drift across regenerations.
