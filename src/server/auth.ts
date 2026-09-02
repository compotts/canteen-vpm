import { HttpError } from "./http";
import { readAdminSession, hashSessionId } from "./admin-session";
import {
  CanteenUnavailableError,
  getSessionId,
  getValgyklaUsername,
} from "./valgykla-identity";
import { getPermissions, isOwner, normalizeUsername } from "./queries/admins";
import type { AdminPermission } from "@/lib/permissions";
import type { AdminSessionInfo } from "@/types/api";

const IDENTITY_TTL_MS = 5 * 60 * 1000;
const NEGATIVE_TTL_MS = 30 * 1000;
const CACHE_LIMIT = 500;

const identityCache = new Map<
  string,
  { username: string | null; expiresAt: number }
>();

function pruneCache(): void {
  if (identityCache.size <= CACHE_LIMIT) return;
  const now = Date.now();
  for (const [key, entry] of identityCache) {
    if (entry.expiresAt <= now) identityCache.delete(key);
  }
  if (identityCache.size > CACHE_LIMIT) identityCache.clear();
}

async function resolveIdentity(request: Request): Promise<string | null> {
  const sessionId = getSessionId(request);
  if (!sessionId) return null;

  const cached = identityCache.get(sessionId);
  if (cached && Date.now() < cached.expiresAt) return cached.username;

  const reported = await getValgyklaUsername(sessionId, request);
  const username = reported ? normalizeUsername(reported) : null;

  pruneCache();
  identityCache.set(sessionId, {
    username,
    expiresAt: Date.now() + (username ? IDENTITY_TTL_MS : NEGATIVE_TTL_MS),
  });

  return username;
}

export async function getIdentity(request: Request): Promise<string | null> {
  try {
    return await resolveIdentity(request);
  } catch (error) {
    if (error instanceof CanteenUnavailableError) return null;
    throw error;
  }
}

export async function requireIdentity(request: Request): Promise<string> {
  let username: string | null;
  try {
    username = await resolveIdentity(request);
  } catch (error) {
    if (error instanceof CanteenUnavailableError) {
      throw new HttpError(503, `canteen unavailable: ${error.reason}`);
    }
    throw error;
  }

  if (!username) throw new HttpError(401, "canteen session required");
  return username;
}

export async function getAdminSessionInfo(
  request: Request
): Promise<AdminSessionInfo | null> {
  const session = readAdminSession(request);
  if (!session) return null;

  const sessionId = getSessionId(request);
  if (!sessionId || hashSessionId(sessionId) !== session.sessionHash) {
    return null;
  }

  const permissions = await getPermissions(session.username);
  if (!permissions) return null;

  return {
    username: normalizeUsername(session.username),
    permissions,
    isOwner: isOwner(session.username),
  };
}

export async function requireAdmin(
  request: Request,
  permission?: AdminPermission
): Promise<AdminSessionInfo> {
  const info = await getAdminSessionInfo(request);
  if (!info) throw new HttpError(401, "admin session required");
  if (permission && !info.permissions.includes(permission)) {
    throw new HttpError(403, "forbidden");
  }
  return info;
}

export async function requireOwner(
  request: Request
): Promise<AdminSessionInfo> {
  const info = await requireAdmin(request);
  if (!info.isOwner) throw new HttpError(403, "forbidden");
  return info;
}
