import crypto from "crypto";
import { type NextResponse } from "next/server";

export const GUEST_COOKIE_NAME = "flipped_guest_token";

const DEFAULT_DEV_SECRET = "flipped-development-fallback-secret-minimum-32-chars-long";

function getSecretKey(): string {
  return process.env.GUEST_SESSION_SECRET || DEFAULT_DEV_SECRET;
}

/**
 * Signs a guest ID with a timestamp using HMAC-SHA256.
 */
export function signGuestToken(guestId: string, timestamp: number = Date.now()): string {
  const secret = getSecretKey();
  const payload = `${guestId}.${timestamp}`;
  const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${hmac}`;
}

/**
 * Cryptographically verifies a guest token signature.
 * Returns the validated guestId or null if invalid or tampered.
 */
export function verifyGuestToken(token: string | null | undefined): string | null {
  if (!token || typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [guestId, timestampStr, signature] = parts;
  if (!guestId || !timestampStr || !signature) {
    return null;
  }

  const payload = `${guestId}.${timestampStr}`;
  const secret = getSecretKey();
  const expectedHmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  // Constant-time comparison to prevent timing attacks
  try {
    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expectedHmac, "hex");
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    return guestId;
  } catch {
    return null;
  }
}

/**
 * Extracts the cookie value from a standard Request headers or cookie string.
 */
export function extractCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const pairs = cookieHeader.split(/[;,]/).map((p) => p.trim());
  for (const pair of pairs) {
    const [k, v] = pair.split("=");
    if (k === name && v) {
      return decodeURIComponent(v);
    }
  }
  return null;
}

export interface GuestSession {
  guestId: string;
  isNew: boolean;
  cookieToSet: string | null;
  tokenToSet: string | null;
}

/**
 * Retrieves the validated guest ID from the incoming Request.
 * If none exists or signature fails, creates a new cryptographically signed guest session.
 */
export function resolveGuestSession(request: Request): GuestSession {
  const cookieHeader = request.headers.get("cookie");
  const rawToken = extractCookie(cookieHeader, GUEST_COOKIE_NAME);
  const existingGuestId = verifyGuestToken(rawToken);

  if (existingGuestId) {
    return {
      guestId: existingGuestId,
      isNew: false,
      cookieToSet: null,
      tokenToSet: null,
    };
  }

  // Generate a fresh random UUID guest identity
  const newGuestId = `guest_${crypto.randomUUID()}`;
  const newToken = signGuestToken(newGuestId);
  const isProd = process.env.NODE_ENV === "production";

  // Build secure cookie directive
  // HttpOnly, SameSite=Lax, Secure in production, Max-Age = 365 days
  const maxAge = 60 * 60 * 24 * 365;
  const cookieToSet = `${GUEST_COOKIE_NAME}=${encodeURIComponent(
    newToken
  )}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${isProd ? "; Secure" : ""}`;

  return {
    guestId: newGuestId,
    isNew: true,
    cookieToSet,
    tokenToSet: newToken,
  };
}

/**
 * Attaches the guest session cookie to a NextResponse using Next.js ResponseCookies API.
 */
export function attachGuestCookie<T>(
  response: NextResponse<T>,
  sessionOrToken: GuestSession | string | null | undefined
): NextResponse<T> {
  const token =
    typeof sessionOrToken === "string" ? sessionOrToken : (sessionOrToken?.tokenToSet ?? null);

  if (token) {
    const isProd = process.env.NODE_ENV === "production";
    response.cookies.set({
      name: GUEST_COOKIE_NAME,
      value: token,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}
