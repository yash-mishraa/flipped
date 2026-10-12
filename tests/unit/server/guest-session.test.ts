import { describe, it, expect } from "vitest";
import {
  signGuestToken,
  verifyGuestToken,
  extractCookie,
  resolveGuestSession,
  GUEST_COOKIE_NAME,
} from "@/server/auth/guest-session";

describe("Guest Session Security", () => {
  it("generates, signs, and verifies valid guest tokens", () => {
    const guestId = "guest_test_12345";
    const token = signGuestToken(guestId);

    const verified = verifyGuestToken(token);
    expect(verified).toBe(guestId);
  });

  it("rejects tampered tokens with invalid signatures", () => {
    const token = signGuestToken("guest_legit_user");
    const [id, ts] = token.split(".");
    const tampered = `${id}.${ts}.invalid_tampered_signature_hex`;

    expect(verifyGuestToken(tampered)).toBeNull();
  });

  it("rejects malformed token strings", () => {
    expect(verifyGuestToken("")).toBeNull();
    expect(verifyGuestToken("random_string")).toBeNull();
    expect(verifyGuestToken("a.b")).toBeNull();
    expect(verifyGuestToken(null)).toBeNull();
    expect(verifyGuestToken(undefined)).toBeNull();
  });

  it("extracts named cookies from standard headers", () => {
    const cookieHeader = `theme=dark; ${GUEST_COOKIE_NAME}=token123; session=active`;
    const val = extractCookie(cookieHeader, GUEST_COOKIE_NAME);
    expect(val).toBe("token123");

    expect(extractCookie(cookieHeader, "nonexistent")).toBeNull();
    expect(extractCookie(null, GUEST_COOKIE_NAME)).toBeNull();
  });

  it("resolves existing guest sessions from request cookies", () => {
    const validGuestId = "guest_returning_player";
    const validToken = signGuestToken(validGuestId);

    const request = new Request("http://localhost:3000/api/game/daily/start", {
      headers: {
        cookie: `${GUEST_COOKIE_NAME}=${validToken}`,
      },
    });

    const session = resolveGuestSession(request);
    expect(session.isNew).toBe(false);
    expect(session.guestId).toBe(validGuestId);
    expect(session.cookieToSet).toBeNull();
  });

  it("creates and signs a new guest identity when no valid cookie exists", () => {
    const request = new Request("http://localhost:3000/api/game/daily/start");

    const session = resolveGuestSession(request);
    expect(session.isNew).toBe(true);
    expect(session.guestId).toMatch(/^guest_/);
    expect(session.cookieToSet).toContain(GUEST_COOKIE_NAME);
    expect(session.cookieToSet).toContain("HttpOnly");
    expect(session.cookieToSet).toContain("SameSite=Lax");
  });
});
