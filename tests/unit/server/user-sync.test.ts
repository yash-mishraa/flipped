import { describe, it, expect, beforeEach } from "vitest";
import { POST, GET } from "@/app/api/user/sync/route";
import { inMemoryDb } from "@/server/db/client";

describe("User Sync API (/api/user/sync)", () => {
  const testUserId = "user_clerk_test_456";

  beforeEach(() => {
    inMemoryDb.clearAttempts();
  });

  it("rejects unauthorized requests without userId", async () => {
    const req = new Request("http://localhost:3000/api/user/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("Unauthorized");
  });

  it("merges client progress with server progress and returns updated stats", async () => {
    const clientProgress = {
      version: 1 as const,
      daily: {
        "2026-10-12": {
          date: "2026-10-12",
          puzzleId: "bitter-truth",
          status: "WON" as const,
          finalScore: 95,
          elapsedSeconds: 15,
          hintsUsed: 0,
          completedAt: "2026-10-12T10:00:00Z",
        },
      },
      classic: {
        recentlyPlayedIds: ["puzzle-1"],
        lastDifficulty: "MEDIUM" as const,
        totalPlayed: 3,
        totalWins: 2,
      },
    };

    const req = new Request("http://localhost:3000/api/user/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: testUserId, progress: clientProgress }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.status).toBe("SYNCED");
    expect(data.userId).toBe(testUserId);
    expect(data.progress.daily["2026-10-12"]).toBeDefined();
    expect(data.stats.totalPlayed).toBe(4); // 1 daily + 3 classic
    expect(data.stats.totalWins).toBe(3); // 1 daily + 2 classic
    expect(data.stats.winRate).toBe(75);

    // Verify stored in inMemoryDb
    const stored = inMemoryDb.getUserProgress(testUserId);
    expect(stored).toBeDefined();
    expect(stored?.daily?.["2026-10-12"]?.finalScore).toBe(95);
  });

  it("retrieves synced user stats via GET", async () => {
    // Seed in-memory user progress
    inMemoryDb.saveUserProgress(testUserId, {
      version: 1,
      daily: {
        "2026-10-13": {
          date: "2026-10-13",
          puzzleId: "war-cry",
          status: "WON",
          finalScore: 88,
          elapsedSeconds: 22,
          hintsUsed: 1,
          completedAt: "2026-10-13T10:00:00Z",
        },
      },
      classic: {
        recentlyPlayedIds: [],
        lastDifficulty: "HARD",
        totalPlayed: 10,
        totalWins: 8,
      },
    });

    const req = new Request(`http://localhost:3000/api/user/sync?userId=${testUserId}`, {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.status).toBe("OK");
    expect(data.userId).toBe(testUserId);
    expect(data.stats.totalPlayed).toBe(11);
    expect(data.stats.totalWins).toBe(9);
  });
});
