import { PrismaClient } from "@prisma/client";
import { CURATED_PUZZLES } from "../src/features/game/data/puzzles";
import { PUBLISHED_DAILY_SCHEDULE } from "../src/features/game/data/daily-schedule";

const prisma = new PrismaClient();

export async function seedDatabase(client: PrismaClient = prisma) {
  console.log("🌱 Starting Flipped database seed...");

  let puzzleCount = 0;
  for (const p of CURATED_PUZZLES) {
    await client.puzzle.upsert({
      where: { id: p.id },
      update: {
        clueWord1: p.clueWords[0],
        clueWord2: p.clueWords[1],
        answerWord1: p.answerWords[0],
        answerWord2: p.answerWords[1],
        relationship1: p.transformations[0].relationship,
        relationship2: p.transformations[1].relationship,
        explanation1: p.transformations[0].explanation,
        explanation2: p.transformations[1].explanation,
        difficulty: p.difficulty,
        approvedVariants: p.approvedVariants ? [...p.approvedVariants] : [],
        hints: p.metadata?.hints ? [...p.metadata.hints] : [],
        publicationStatus: "PUBLISHED",
      },
      create: {
        id: p.id,
        clueWord1: p.clueWords[0],
        clueWord2: p.clueWords[1],
        answerWord1: p.answerWords[0],
        answerWord2: p.answerWords[1],
        relationship1: p.transformations[0].relationship,
        relationship2: p.transformations[1].relationship,
        explanation1: p.transformations[0].explanation,
        explanation2: p.transformations[1].explanation,
        difficulty: p.difficulty,
        approvedVariants: p.approvedVariants ? [...p.approvedVariants] : [],
        hints: p.metadata?.hints ? [...p.metadata.hints] : [],
        publicationStatus: "PUBLISHED",
      },
    });
    puzzleCount++;
  }

  let scheduleCount = 0;
  for (const item of PUBLISHED_DAILY_SCHEDULE) {
    await client.dailyAssignment.upsert({
      where: { date: item.date },
      update: {
        puzzleId: item.puzzleId,
        publicationStatus: item.publicationStatus,
        note: item.note,
      },
      create: {
        date: item.date,
        puzzleId: item.puzzleId,
        publicationStatus: item.publicationStatus,
        note: item.note,
      },
    });
    scheduleCount++;
  }

  console.log(
    `✅ Successfully seeded ${puzzleCount} curated puzzles and ${scheduleCount} daily assignments.`
  );
}

// Execute when invoked directly
if (process.argv[1]?.includes("seed")) {
  seedDatabase()
    .catch((err) => {
      console.error("❌ Seed failed:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
