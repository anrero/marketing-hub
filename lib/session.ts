import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "mh-session";
const JWT_SECRET = process.env.JWT_SECRET || "redking-hub-secret-2026";

// ── Simple HMAC-based token (no external JWT library needed) ──

function sign(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

function verify(token: string): Record<string, unknown> | null {
  try {
    const [header, body, signature] = token.split(".");
    if (!header || !body || !signature) return null;
    const expected = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
    if (signature !== expected) return null;
    return JSON.parse(Buffer.from(body, "base64url").toString());
  } catch {
    return null;
  }
}

// ── Public API ──

export function createSessionToken(userId: string): string {
  return sign({ userId, iat: Math.floor(Date.now() / 1000) });
}

export function verifySessionToken(token: string): string | null {
  const payload = verify(token);
  if (!payload || typeof payload.userId !== "string") return null;
  return payload.userId;
}

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  if (!cookie?.value) return null;
  return verifySessionToken(cookie.value);
}

export function sessionCookieOptions(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  };
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
