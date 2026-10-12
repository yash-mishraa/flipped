import { describe, it, expect } from "vitest";
import { checkRateLimit } from "@/server/utils/rate-limit";

describe("Rate Limiter", () => {
  it("permits requests within configured threshold", () => {
    const id = "client_test_ok";
    const res1 = checkRateLimit(id, 3, 1000);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = checkRateLimit(id, 3, 1000);
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = checkRateLimit(id, 3, 1000);
    expect(res3.allowed).toBe(true);
    expect(res3.remaining).toBe(0);

    // 4th request exceeds threshold
    const res4 = checkRateLimit(id, 3, 1000);
    expect(res4.allowed).toBe(false);
    expect(res4.remaining).toBe(0);
  });
});
