import type { UserProfile } from "@/types/api";

const VALGYKLA_ORIGIN =
  process.env.VALGYKLA_ORIGIN ?? "https://valgykla.vpm.lt";
const SESSION_COOKIE = "PHPSESSID";
const USERINFO_PATTERN =
  /<div\b[^>]*\bid\s*=\s*["']userinfo["'][^>]*>[\s\S]*?<div\b[^>]*\bclass\s*=\s*["'](?:[^"']*\s)?name(?:\s[^"']*)?["'][^>]*>([\s\S]*?)<\/div>/i;
const STATUS_TTL_MS = 60 * 1000;

export type CanteenProblem = "certificate" | "unreachable";

export type CanteenStatus =
  | { ok: true; reason: null }
  | { ok: false; reason: CanteenProblem };

export class CanteenUnavailableError extends Error {
  constructor(readonly reason: CanteenProblem) {
    super(`canteen is unavailable: ${reason}`);
    this.name = "CanteenUnavailableError";
  }
}

function classify(error: unknown): CanteenProblem {
  const cause = (error as { cause?: { code?: string } })?.cause;
  const code = String(cause?.code ?? "");
  return code.startsWith("ERR_TLS") || code.includes("CERT")
    ? "certificate"
    : "unreachable";
}

export function getSessionId(request: Request): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;

  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() !== SESSION_COOKIE) continue;
    const value = part.slice(index + 1).trim();
    return value.length > 0 ? value : null;
  }
  return null;
}

function htmlText(value: string): string {
  const entities: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
  };
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (match, entity: string) => {
      if (!entity.startsWith("#")) return entities[entity.toLowerCase()] ?? match;
      const hex = entity[1]?.toLowerCase() === "x";
      const code = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
      return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff)
        ? String.fromCodePoint(code)
        : match;
    })
    .replace(/\s+/g, " ")
    .trim();
}

export function parseValgyklaProfile(html: string): UserProfile | null {
  const name = html.match(USERINFO_PATTERN)?.[1];
  if (!name) return null;

  const login = name.match(/<em\b[^>]*>([\s\S]*?)<\/em>/i)?.[1];
  const username = login ? htmlText(login) : "";
  if (!username) return null;

  const fullName = htmlText(
    name.replace(/<em\b[^>]*>[\s\S]*?<\/em>/i, "")
      .replace(/\(\s*\)\s*$/, "")
  );
  return { username, fullName: fullName || null };
}

export async function getValgyklaProfile(
  sessionId: string,
  request?: Request
): Promise<UserProfile | null> {
  const headers: Record<string, string> = {
    cookie: `${SESSION_COOKIE}=${sessionId}`,
  };

  const userAgent = request?.headers.get("user-agent");
  if (userAgent) headers["user-agent"] = userAgent;

  const language = request?.headers.get("accept-language");
  if (language) headers["accept-language"] = language;

  let response: Response;
  try {
    response = await fetch(`${VALGYKLA_ORIGIN}/`, {
      headers,
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (response.status !== 200) return null;
    return parseValgyklaProfile(await response.text());
  } catch (error) {
    throw new CanteenUnavailableError(classify(error));
  }
}

export async function getValgyklaUsername(
  sessionId: string,
  request?: Request
): Promise<string | null> {
  return (await getValgyklaProfile(sessionId, request))?.username ?? null;
}

let cachedStatus: { status: CanteenStatus; expiresAt: number } | null = null;

export async function getCanteenStatus(): Promise<CanteenStatus> {
  if (cachedStatus && Date.now() < cachedStatus.expiresAt) {
    return cachedStatus.status;
  }

  let status: CanteenStatus;
  try {
    await fetch(`${VALGYKLA_ORIGIN}/`, {
      redirect: "manual",
      cache: "no-store",
    });
    status = { ok: true, reason: null };
  } catch (error) {
    status = { ok: false, reason: classify(error) };
  }

  cachedStatus = { status, expiresAt: Date.now() + STATUS_TTL_MS };
  return status;
}
