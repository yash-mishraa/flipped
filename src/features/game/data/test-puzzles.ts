import type { Puzzle } from "../domain/types";

/**
 * Curated fixture puzzle set intended exclusively for test suites,
 * development sandbox validation, and engine verification.
 *
 * NOT for production Daily publication.
 */
export const TEST_PUZZLES: readonly Puzzle[] = [
  {
    id: "test-fast-food",
    clueWords: ["SLOW", "MEAL"],
    answerWords: ["FAST", "FOOD"],
    transformations: [
      {
        clueWord: "SLOW",
        answerWord: "FAST",
        relationship: "ANTONYM",
        explanation: "Fast is the direct antonym of slow.",
      },
      {
        clueWord: "MEAL",
        answerWord: "FOOD",
        relationship: "SYNONYM",
        explanation: "Food is a standard synonym for meal.",
      },
    ],
    difficulty: "EASY",
    approvedVariants: ["QUICK BITE"],
    metadata: {
      author: "Engine Test Fixtures",
      hints: ["Think of quick service dining", "Opposite of leisurely eating"],
    },
  },
  {
    id: "test-war-cry",
    clueWords: ["PEACE", "LAUGH"],
    answerWords: ["WAR", "CRY"],
    transformations: [
      {
        clueWord: "PEACE",
        answerWord: "WAR",
        relationship: "ANTONYM",
        explanation: "War is the direct opposite of peace.",
      },
      {
        clueWord: "LAUGH",
        answerWord: "CRY",
        relationship: "ANTONYM",
        explanation: "Cry is the emotional antonym of laugh.",
      },
    ],
    difficulty: "EASY",
    approvedVariants: ["BATTLE CRY"],
    metadata: {
      author: "Engine Test Fixtures",
      hints: ["A battle shout", "Vocal combat rallying call"],
    },
  },
  {
    id: "test-hot-spring",
    clueWords: ["COLD", "WATER"],
    answerWords: ["HOT", "SPRING"],
    transformations: [
      {
        clueWord: "COLD",
        answerWord: "HOT",
        relationship: "ANTONYM",
        explanation: "Hot is the direct thermal antonym of cold.",
      },
      {
        clueWord: "WATER",
        answerWord: "SPRING",
        relationship: "SYNONYM",
        explanation: "A spring is a natural source and body of water.",
      },
    ],
    difficulty: "EASY",
    metadata: {
      author: "Engine Test Fixtures",
      hints: ["Geothermal mineral bath", "Natural heated pool"],
    },
  },
  {
    id: "test-deep-sleep",
    clueWords: ["SHALLOW", "REST"],
    answerWords: ["DEEP", "SLEEP"],
    transformations: [
      {
        clueWord: "SHALLOW",
        answerWord: "DEEP",
        relationship: "ANTONYM",
        explanation: "Deep is the physical and metaphorical opposite of shallow.",
      },
      {
        clueWord: "REST",
        answerWord: "SLEEP",
        relationship: "SYNONYM",
        explanation: "Sleep is an essential biological synonym for rest.",
      },
    ],
    difficulty: "MEDIUM",
    metadata: {
      author: "Engine Test Fixtures",
      hints: ["Unconscious slumber", "Restorative delta-wave cycle"],
    },
  },
  {
    id: "test-sweet-dreams",
    clueWords: ["SOUR", "VISIONS"],
    answerWords: ["SWEET", "DREAMS"],
    transformations: [
      {
        clueWord: "SOUR",
        answerWord: "SWEET",
        relationship: "ANTONYM",
        explanation: "Sweet is the sensory antonym of sour.",
      },
      {
        clueWord: "VISIONS",
        answerWord: "DREAMS",
        relationship: "SYNONYM",
        explanation: "Dreams and visions represent mental imagery during sleep.",
      },
    ],
    difficulty: "MEDIUM",
    metadata: {
      author: "Engine Test Fixtures",
      hints: ["Bedtime well-wishing phrase", "Pleasant nocturnal thoughts"],
    },
  },
  {
    id: "test-open-door",
    clueWords: ["CLOSED", "GATE"],
    answerWords: ["OPEN", "DOOR"],
    transformations: [
      {
        clueWord: "CLOSED",
        answerWord: "OPEN",
        relationship: "ANTONYM",
        explanation: "Open is the opposite of closed.",
      },
      {
        clueWord: "GATE",
        answerWord: "DOOR",
        relationship: "SYNONYM",
        explanation: "Door and gate are architectural synonyms for entryways.",
      },
    ],
    difficulty: "EASY",
    metadata: {
      author: "Engine Test Fixtures",
      hints: ["Welcoming accessibility policy", "Unbarred threshold"],
    },
  },
  {
    id: "test-high-tide",
    clueWords: ["LOW", "CURRENT"],
    answerWords: ["HIGH", "TIDE"],
    transformations: [
      {
        clueWord: "LOW",
        answerWord: "HIGH",
        relationship: "ANTONYM",
        explanation: "High is the spatial and positional antonym of low.",
      },
      {
        clueWord: "CURRENT",
        answerWord: "TIDE",
        relationship: "SYNONYM",
        explanation: "Tide and current both denote ocean water movement.",
      },
    ],
    difficulty: "MEDIUM",
    metadata: {
      author: "Engine Test Fixtures",
      hints: ["Peak oceanic water level", "Twice-daily lunar peak"],
    },
  },
  {
    id: "test-wild-life",
    clueWords: ["TAME", "EXISTENCE"],
    answerWords: ["WILD", "LIFE"],
    transformations: [
      {
        clueWord: "TAME",
        answerWord: "WILD",
        relationship: "ANTONYM",
        explanation: "Wild is the natural opposite of domesticated or tame.",
      },
      {
        clueWord: "EXISTENCE",
        answerWord: "LIFE",
        relationship: "SYNONYM",
        explanation: "Life and existence are philosophical and biological synonyms.",
      },
    ],
    difficulty: "MEDIUM",
    approvedVariants: ["FERAL NATURE"],
    metadata: {
      author: "Engine Test Fixtures",
      hints: ["Undomesticated animals and nature", "Flora and fauna"],
    },
  },
  {
    id: "test-good-night",
    clueWords: ["EVIL", "DAY"],
    answerWords: ["GOOD", "NIGHT"],
    transformations: [
      {
        clueWord: "EVIL",
        answerWord: "GOOD",
        relationship: "ANTONYM",
        explanation: "Good is the moral antonym of evil.",
      },
      {
        clueWord: "DAY",
        answerWord: "NIGHT",
        relationship: "ANTONYM",
        explanation: "Night is the diurnal opposite of day.",
      },
    ],
    difficulty: "EASY",
    approvedVariants: ["SWEET SLUMBER"],
    metadata: {
      author: "Engine Test Fixtures",
      hints: ["Evening farewell", "Parting salutation before sleep"],
    },
  },
  {
    id: "test-true-love",
    clueWords: ["FALSE", "AFFECTION"],
    answerWords: ["TRUE", "LOVE"],
    transformations: [
      {
        clueWord: "FALSE",
        answerWord: "TRUE",
        relationship: "ANTONYM",
        explanation: "True is the logical antonym of false.",
      },
      {
        clueWord: "AFFECTION",
        answerWord: "LOVE",
        relationship: "SYNONYM",
        explanation: "Love is an intense synonym for affection.",
      },
    ],
    difficulty: "MEDIUM",
    metadata: {
      author: "Engine Test Fixtures",
      hints: ["Idealized romantic devotion", "Soulmate connection"],
    },
  },
  {
    id: "test-ancient-history",
    clueWords: ["MODERN", "PAST"],
    answerWords: ["ANCIENT", "HISTORY"],
    transformations: [
      {
        clueWord: "MODERN",
        answerWord: "ANCIENT",
        relationship: "ANTONYM",
        explanation: "Ancient is the chronological antonym of modern.",
      },
      {
        clueWord: "PAST",
        answerWord: "HISTORY",
        relationship: "SYNONYM",
        explanation: "History is the systematic chronicle of the past.",
      },
    ],
    difficulty: "HARD",
    metadata: {
      author: "Engine Test Fixtures",
      hints: ["Events long ago that no longer matter", "Classical antiquity studies"],
    },
  },
  {
    id: "test-light-house",
    clueWords: ["DARK", "CABIN"],
    answerWords: ["LIGHT", "HOUSE"],
    transformations: [
      {
        clueWord: "DARK",
        answerWord: "LIGHT",
        relationship: "ANTONYM",
        explanation: "Light is the optical opposite of dark.",
      },
      {
        clueWord: "CABIN",
        answerWord: "HOUSE",
        relationship: "SYNONYM",
        explanation: "Cabin and house are architectural synonyms for dwellings.",
      },
    ],
    difficulty: "MEDIUM",
    approvedVariants: ["BEACON TOWER"],
    metadata: {
      author: "Engine Test Fixtures",
      hints: ["Navigational beacon tower for ships", "Coastal beacon"],
    },
  },
];
