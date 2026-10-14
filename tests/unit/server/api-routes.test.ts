import { describe, it, expect, beforeEach } from "vitest";
import { GET as healthHandler } from "@/app/api/health/route";
import { POST as dailyStartHandler } from "@/app/api/game/daily/start/route";
import { POST as classicStartHandler } from "@/app/api/game/classic/start/route";
import { POST as submitHandler } from "@/app/api/game/attempt/[id]/submit/route";
import { POST as hintHandler } from "@/app/api/game/attempt/[id]/hint/route";
import { POST as timeoutHandler } from "@/app/api/game/attempt/[id]/timeout/route";
import { GET as attemptGetHandler } from "@/app/api/game/attempt/[id]/route";
import { inMemoryDb } from "@/server/db/client";

describe("API Route Handlers", () => {
  beforeEach(() => {
    inMemoryDb.clearAttempts();
    inMemoryDb.seedDefaultData();
  });

  it("GET /api/health returns service status and database mode", async () => {
    const res = await healthHandler();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(data.service).toBe("flipped-api");
    expect(data.database).toBeDefined();
  });

  it("POST /api/game/daily/start starts attempt and sets guest cookie", async () => {
    const req = new Request("http://localhost:3000/api/game/daily/start", {
      method: "POST",
    });

    const res = await dailyStartHandler(req);
    expect(res.status).toBe(200);

    const setCookie = res.headers.get("Set-Cookie");
    expect(setCookie).toContain("flipped_guest_token");

    const data = await res.json();
    expect(data.status).toBe("STARTED");
    expect(data.payload.mode).toBe("DAILY");
    expect(data.payload.firstLetters).toBeDefined();
    // Answer words must NOT be leaked
    expect(data.payload.answerWords).toBeUndefined();
  });

  it("POST /api/game/classic/start starts classic attempt", async () => {
    const req = new Request("http://localhost:3000/api/game/classic/start", {
      method: "POST",
      body: JSON.stringify({ difficulty: "EASY" }),
    });

    const res = await classicStartHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe("STARTED");
    expect(data.payload.mode).toBe("CLASSIC");
    expect(data.payload.difficulty).toBe("EASY");
  });

  it("POST /api/game/attempt/[id]/hint requests authorized hint", async () => {
    const startReq = new Request("http://localhost:3000/api/game/daily/start", { method: "POST" });
    const startRes = await dailyStartHandler(startReq);
    const startData = await startRes.json();
    const cookie = startRes.headers.get("Set-Cookie")!;
    const attemptId = startData.payload.attemptId;

    const hintReq = new Request(`http://localhost:3000/api/game/attempt/${attemptId}/hint`, {
      method: "POST",
      headers: { cookie },
    });

    const hintRes = await hintHandler(hintReq, {
      params: Promise.resolve({ id: attemptId }),
    });
    expect(hintRes.status).toBe(200);

    const hintData = await hintRes.json();
    expect(hintData.success).toBe(true);
    expect(hintData.letter).toBeDefined();
    expect(hintData.hintsUsed).toBe(1);
  });

  it("GET /api/game/attempt/[id] forbids inspecting active attempt", async () => {
    const startReq = new Request("http://localhost:3000/api/game/daily/start", { method: "POST" });
    const startRes = await dailyStartHandler(startReq);
    const startData = await startRes.json();
    const cookie = startRes.headers.get("Set-Cookie")!;
    const attemptId = startData.payload.attemptId;

    const inspectReq = new Request(`http://localhost:3000/api/game/attempt/${attemptId}`, {
      method: "GET",
      headers: { cookie },
    });

    const inspectRes = await attemptGetHandler(inspectReq, {
      params: Promise.resolve({ id: attemptId }),
    });
    // Active attempt inspection must be forbidden to protect answers
    expect(inspectRes.status).toBe(403);
  });

  it("POST /api/game/attempt/[id]/submit awards win and updates status", async () => {
    const startReq = new Request("http://localhost:3000/api/game/daily/start", { method: "POST" });
    const startRes = await dailyStartHandler(startReq);
    const startData = await startRes.json();
    const cookie = startRes.headers.get("Set-Cookie")!;
    const attemptId = startData.payload.attemptId;

    const attempt = inMemoryDb.getAttempt(attemptId)!;
    const puzzle = inMemoryDb.getPuzzle(attempt.puzzleId)!;
    const answerPhrase = puzzle.answerWords.join(" ");

    const submitReq = new Request(`http://localhost:3000/api/game/attempt/${attemptId}/submit`, {
      method: "POST",
      headers: {
        cookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phrase: answerPhrase }),
    });

    const submitRes = await submitHandler(submitReq, {
      params: Promise.resolve({ id: attemptId }),
    });
    expect(submitRes.status).toBe(200);

    const submitData = await submitRes.json();
    expect(submitData.status).toBe("WON");
    expect(submitData.result.isWon).toBe(true);
    expect(submitData.result.canonicalPhrase).toBe(answerPhrase);
  });

  it("POST /api/game/attempt/[id]/timeout finalizes timeout", async () => {
    const startReq = new Request("http://localhost:3000/api/game/daily/start", { method: "POST" });
    const startRes = await dailyStartHandler(startReq);
    const startData = await startRes.json();
    const cookie = startRes.headers.get("Set-Cookie")!;
    const attemptId = startData.payload.attemptId;

    const timeoutReq = new Request(`http://localhost:3000/api/game/attempt/${attemptId}/timeout`, {
      method: "POST",
      headers: { cookie },
    });

    const timeoutRes = await timeoutHandler(timeoutReq, {
      params: Promise.resolve({ id: attemptId }),
    });
    expect(timeoutRes.status).toBe(200);

    const timeoutData = await timeoutRes.json();
    expect(timeoutData.success).toBe(true);
    expect(timeoutData.result.status).toBe("TIMED_OUT");
  });
});
