import { getAdminSessionInfo, getIdentity } from "@/server/auth";
import {
  adminCookieHeader,
  createAdminSession,
} from "@/server/admin-session";
import { getSessionId } from "@/server/valgykla-identity";
import { findAdmin, isOwner } from "@/server/queries/admins";
import { constantTimeEquals, verifyPassword } from "@/server/password";
import { ADMIN_PERMISSIONS } from "@/lib/permissions";
import { HttpError, errorResponse, json, parse, readJson } from "@/server/http";
import { adminLoginSchema } from "@/lib/validators";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

const attempts = new Map<string, { count: number; resetAt: number }>();

function throttleKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded?.trim()) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function throttle(request: Request): void {
  const key = throttleKey(request);
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }

  entry.count += 1;
  if (entry.count > MAX_ATTEMPTS) {
    throw new HttpError(429, "too many attempts, try again later");
  }
}

function ownerPassword(): string | null {
  const value = process.env.OWNER_PASSWORD;
  return value && value.length > 0 ? value : null;
}

export async function GET(request: Request): Promise<Response> {
  try {
    const info = await getAdminSessionInfo(request);
    if (!info) throw new HttpError(401, "admin session required");
    return json(info);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    throttle(request);

    const sessionId = getSessionId(request);
    if (!sessionId) throw new HttpError(401, "canteen session required");

    const username = await getIdentity(request);
    if (!username) throw new HttpError(401, "canteen session required");
    const input = parse(adminLoginSchema, await readJson(request));

    if (isOwner(username)) {
      const expected = ownerPassword();
      if (!expected || !constantTimeEquals(input.password, expected)) {
        throw new HttpError(401, "invalid password");
      }

      attempts.delete(throttleKey(request));
      return new Response(
        JSON.stringify({
          username,
          permissions: [...ADMIN_PERMISSIONS],
          isOwner: true,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Set-Cookie": adminCookieHeader(
              createAdminSession(username, sessionId)
            ),
          },
        }
      );
    }

    const record = await findAdmin(username);
    if (!record || !verifyPassword(input.password, record.passwordHash)) {
      throw new HttpError(401, "invalid password");
    }

    attempts.delete(throttleKey(request));
    return new Response(
      JSON.stringify({
        username,
        permissions: record.permissions,
        isOwner: false,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": adminCookieHeader(
            createAdminSession(username, sessionId)
          ),
        },
      }
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: { "Set-Cookie": adminCookieHeader(null) },
  });
}
