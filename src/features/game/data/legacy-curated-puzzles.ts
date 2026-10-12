import type { Puzzle } from "../domain/types";

/**
 * Historical seed puzzles for Flipped (Parts 1-8).
 * These 20 hand-crafted puzzles are permanently preserved as the foundation
 * of the master corpus to guarantee 100% backward compatibility and Daily calendar integrity.
 */
export const LEGACY_CURATED_PUZZLES: readonly Puzzle[] = [
  // --- EASY TIER ---
  {
    id: "fast-food",
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
      hints: ["Quick-service dining", "Opposite of leisurely dining"],
    },
  },
  {
    id: "war-cry",
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
      hints: ["A battle shout", "Vocal combat rallying call"],
    },
  },
  {
    id: "hot-spring",
    clueWords: ["COLD", "WATER"],
    answerWords: ["HOT", "SPRING"],
    transformations: [
      {
        clueWord: "COLD",
        answerWord: "HOT",
        relationship: "ANTONYM",
        explanation: "Hot is the thermal antonym of cold.",
      },
      {
        clueWord: "WATER",
        answerWord: "SPRING",
        relationship: "SYNONYM",
        explanation: "A spring is a natural geothermal source of water.",
      },
    ],
    difficulty: "EASY",
    metadata: {
      hints: ["Geothermal mineral bath", "Natural heated pool"],
    },
  },
  {
    id: "open-door",
    clueWords: ["CLOSED", "GATE"],
    answerWords: ["OPEN", "DOOR"],
    transformations: [
      {
        clueWord: "CLOSED",
        answerWord: "OPEN",
        relationship: "ANTONYM",
        explanation: "Open is the direct opposite of closed.",
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
      hints: ["Welcoming accessibility policy", "Unbarred threshold"],
    },
  },
  {
    id: "good-night",
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
    metadata: {
      hints: ["Evening farewell", "Parting salutation before sleep"],
    },
  },
  {
    id: "small-town",
    clueWords: ["BIG", "CITY"],
    answerWords: ["SMALL", "TOWN"],
    transformations: [
      {
        clueWord: "BIG",
        answerWord: "SMALL",
        relationship: "ANTONYM",
        explanation: "Small is the size antonym of big.",
      },
      {
        clueWord: "CITY",
        answerWord: "TOWN",
        relationship: "SYNONYM",
        explanation: "Town is a community synonym for city.",
      },
    ],
    difficulty: "EASY",
    metadata: {
      hints: ["Rural community", "Close-knit municipality"],
    },
  },

  // --- MEDIUM TIER ---
  {
    id: "deep-sleep",
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
      hints: ["Unconscious slumber", "Restorative delta-wave cycle"],
    },
  },
  {
    id: "sweet-dreams",
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
        explanation: "Dreams and visions represent mental imagery during slumber.",
      },
    ],
    difficulty: "MEDIUM",
    metadata: {
      hints: ["Bedtime well-wishing phrase", "Pleasant nocturnal thoughts"],
    },
  },
  {
    id: "high-tide",
    clueWords: ["LOW", "CURRENT"],
    answerWords: ["HIGH", "TIDE"],
    transformations: [
      {
        clueWord: "LOW",
        answerWord: "HIGH",
        relationship: "ANTONYM",
        explanation: "High is the spatial antonym of low.",
      },
      {
        clueWord: "CURRENT",
        answerWord: "TIDE",
        relationship: "SYNONYM",
        explanation: "Tide and current represent ocean water movements.",
      },
    ],
    difficulty: "MEDIUM",
    metadata: {
      hints: ["Peak oceanic water level", "Lunar sea surge"],
    },
  },
  {
    id: "wild-life",
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
        explanation: "Life and existence are biological synonyms.",
      },
    ],
    difficulty: "MEDIUM",
    metadata: {
      hints: ["Undomesticated animals and nature", "Flora and fauna"],
    },
  },
  {
    id: "true-love",
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
      hints: ["Idealized romantic devotion", "Soulmate connection"],
    },
  },
  {
    id: "light-house",
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
    metadata: {
      hints: ["Navigational coastal tower", "Beacon for ships"],
    },
  },
  {
    id: "silent-night",
    clueWords: ["NOISY", "EVENING"],
    answerWords: ["SILENT", "NIGHT"],
    transformations: [
      {
        clueWord: "NOISY",
        answerWord: "SILENT",
        relationship: "ANTONYM",
        explanation: "Silent is the acoustic antonym of noisy.",
      },
      {
        clueWord: "EVENING",
        answerWord: "NIGHT",
        relationship: "SYNONYM",
        explanation: "Night and evening are temporal synonyms for nocturnal hours.",
      },
    ],
    difficulty: "MEDIUM",
    metadata: {
      hints: ["Famous peaceful carol", "Tranquil midnight silence"],
    },
  },

  // --- HARD TIER ---
  {
    id: "ancient-history",
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
      hints: ["Events long ago that no longer matter", "Classical antiquity studies"],
    },
  },
  {
    id: "bitter-truth",
    clueWords: ["SWEET", "FACT"],
    answerWords: ["BITTER", "TRUTH"],
    transformations: [
      {
        clueWord: "SWEET",
        answerWord: "BITTER",
        relationship: "ANTONYM",
        explanation: "Bitter is the taste and metaphorical antonym of sweet.",
      },
      {
        clueWord: "FACT",
        answerWord: "TRUTH",
        relationship: "SYNONYM",
        explanation: "Truth is a philosophical synonym for fact.",
      },
    ],
    difficulty: "HARD",
    metadata: {
      hints: ["An unpleasant reality hard to accept", "Unvarnished honesty"],
    },
  },
  {
    id: "cold-shoulder",
    clueWords: ["WARM", "JOINT"],
    answerWords: ["COLD", "SHOULDER"],
    transformations: [
      {
        clueWord: "WARM",
        answerWord: "COLD",
        relationship: "ANTONYM",
        explanation: "Cold is the emotional and thermal antonym of warm.",
      },
      {
        clueWord: "JOINT",
        answerWord: "SHOULDER",
        relationship: "SYNONYM",
        explanation: "A shoulder is an anatomical joint.",
      },
    ],
    difficulty: "HARD",
    metadata: {
      hints: ["Deliberately ignoring someone", "An unfriendly brush-off"],
    },
  },
  {
    id: "freeze-frame",
    clueWords: ["MELT", "BORDER"],
    answerWords: ["FREEZE", "FRAME"],
    transformations: [
      {
        clueWord: "MELT",
        answerWord: "FREEZE",
        relationship: "ANTONYM",
        explanation: "Freeze is the physical phase change antonym of melt.",
      },
      {
        clueWord: "BORDER",
        answerWord: "FRAME",
        relationship: "SYNONYM",
        explanation: "A frame is a structural synonym for a border.",
      },
    ],
    difficulty: "HARD",
    metadata: {
      hints: ["Paused cinematic shot", "Still image in video playback"],
    },
  },
  {
    id: "dry-run",
    clueWords: ["WET", "SPRINT"],
    answerWords: ["DRY", "RUN"],
    transformations: [
      {
        clueWord: "WET",
        answerWord: "DRY",
        relationship: "ANTONYM",
        explanation: "Dry is the moisture antonym of wet.",
      },
      {
        clueWord: "SPRINT",
        answerWord: "RUN",
        relationship: "SYNONYM",
        explanation: "Run is a locomotion synonym for sprint.",
      },
    ],
    difficulty: "HARD",
    metadata: {
      hints: ["Rehearsal before the main event", "Practice walk-through"],
    },
  },
  {
    id: "prime-time",
    clueWords: ["CHOICE", "HOUR"],
    answerWords: ["PRIME", "TIME"],
    transformations: [
      {
        clueWord: "CHOICE",
        answerWord: "PRIME",
        relationship: "SYNONYM",
        explanation: "Prime denotes choice or peak quality.",
      },
      {
        clueWord: "HOUR",
        answerWord: "TIME",
        relationship: "SYNONYM",
        explanation: "Hour and time are temporal synonyms.",
      },
    ],
    difficulty: "HARD",
    metadata: {
      hints: ["Peak evening television viewing hours", "Most sought-after broadcast slot"],
    },
  },
  {
    id: "short-circuit",
    clueWords: ["LONG", "TRACK"],
    answerWords: ["SHORT", "CIRCUIT"],
    transformations: [
      {
        clueWord: "LONG",
        answerWord: "SHORT",
        relationship: "ANTONYM",
        explanation: "Short is the spatial antonym of long.",
      },
      {
        clueWord: "TRACK",
        answerWord: "CIRCUIT",
        relationship: "SYNONYM",
        explanation: "Circuit and track represent closed electrical or physical loops.",
      },
    ],
    difficulty: "HARD",
    metadata: {
      hints: ["Electrical fault bypassing normal load", "Sudden wiring malfunction"],
    },
  },
];
