import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "canteen_admin";
const MAX_AGE_SECONDS = 60 * 60 * 8;

export type AdminSessionPayload = {
  username: string;
  sessionHash: string;
};

function signingSecret(): string | null {
  const value = process.env.ADMIN_SESSION_SECRET || process.env.OWNER_PASSWORD;
  return value && value.length > 0 ? value : null;
}

function signingKey(secret: string): Buffer {
  return createHash("sha256").update(`canteen-admin:${secret}`).digest();
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", signingKey(secret))
    .update(payload)
    .digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function hashSessionId(sessionId: string): string {
  return createHash("sha256").update(sessionId).digest("base64url");
}

export function createAdminSession(
  username: string,
  sessionId: string
): string {
  const secret = signingSecret();
  if (!secret) throw new Error("admin session secret is not configured");

  const payload = Buffer.from(
    JSON.stringify({
      username,
      sessionHash: hashSessionId(sessionId),
      exp: Date.now() + MAX_AGE_SECONDS * 1000,
    })
  ).toString("base64url");

  return `${payload}.${sign(payload, secret)}`;
}

export function readAdminSession(
  request: Request
): AdminSessionPayload | null {
  const secret = signingSecret();
  if (!secret) return null;

  const header = request.headers.get("cookie");
  if (!header) return null;

  let raw: string | null = null;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() !== COOKIE_NAME) continue;
    raw = part.slice(index + 1).trim();
    break;
  }
  if (!raw) return null;

  const separator = raw.lastIndexOf(".");
  if (separator <= 0) return null;

  const payload = raw.slice(0, separator);
  if (!safeEqual(raw.slice(separator + 1), sign(payload, secret))) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof data?.username !== "string") return null;
    if (typeof data?.sessionHash !== "string") return null;
    if (typeof data?.exp !== "number" || Date.now() > data.exp) return null;
    return { username: data.username, sessionHash: data.sessionHash };
  } catch {
    return null;
  }
}

export function adminCookieHeader(value: string | null): string {
  const parts = [
    `${COOKIE_NAME}=${value ?? ""}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    value ? `Max-Age=${MAX_AGE_SECONDS}` : "Max-Age=0",
  ];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}
