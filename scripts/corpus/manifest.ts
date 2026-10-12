/**
 * Corpus Sources and License Manifest
 *
 * This manifest documents all lexical, frequency, and phrase resources
 * utilized in building the Flipped puzzle corpus and difficulty engine.
 */

export interface SourceAttribution {
  readonly name: string;
  readonly version: string;
  readonly license: string;
  readonly licenseUrl: string;
  readonly attribution: string;
  readonly usage: string;
  readonly acquisitionMethod: string;
}

export const CORPUS_MANIFEST: readonly SourceAttribution[] = [
  {
    name: "Princeton WordNet",
    version: "3.1",
    license: "WordNet 3.0 License (BSD-style)",
    licenseUrl: "https://wordnet.princeton.edu/license-and-commercial-use",
    attribution:
      "WordNet Release 3.1. Copyright 2011 by Princeton University. All rights reserved.",
    usage:
      "Lexical relationships, semantic synsets, definitions, and direct antonym/synonym lemma linkages.",
    acquisitionMethod:
      "Offline compiled lexical database extracted from WordNet synsets and Open English WordNet.",
  },
  {
    name: "Open English WordNet",
    version: "2024 Edition",
    license: "CC-BY 4.0",
    licenseUrl: "https://en-word.net/license",
    attribution:
      "Open English WordNet by John P. McCrae, Michael Fell et al., Global WordNet Association.",
    usage:
      "Modern English vocabulary extensions, colloquial synset additions, and validated semantic pairs.",
    acquisitionMethod: "Curated offline lexical extraction.",
  },
  {
    name: "wordfreq / SUBTLEX-US Word Frequency Dataset",
    version: "v3.0",
    license: "CC-BY-SA 4.0",
    licenseUrl: "https://github.com/rspeer/wordfreq",
    attribution:
      "wordfreq by Robyn Speer (Luminoso Technologies) based on SUBTLEX-US, Google Books, and Wikipedia corpora.",
    usage:
      "Logarithmic Zipf word familiarity metrics (scale 1.0 to 7.0) used to objectively score clue and answer word difficulty.",
    acquisitionMethod: "Deterministic offline frequency mapping lookup tables.",
  },
  {
    name: "Curated English Collocations & Phrase Dictionary",
    version: "Flipped Corpus v2.0",
    license: "MIT License",
    licenseUrl: "https://opensource.org/licenses/MIT",
    attribution:
      "Curated by Flipped Project Team. Includes common compound nouns, idioms, and natural English adjective-noun pairings.",
    usage: "Base candidate phrases for backwards puzzle generation.",
    acquisitionMethod:
      "Domain-curated seed phrases filtered for naturalness, familiarity, and puzzle grid compatibility.",
  },
];
