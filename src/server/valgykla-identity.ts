const VALGYKLA_ORIGIN =
  process.env.VALGYKLA_ORIGIN ?? "https://valgykla.vpm.lt";
const SESSION_COOKIE = "PHPSESSID";
const USERNAME_PATTERN =
  /<div id="userinfo">[\s\S]*?<div class="name">[\s\S]*?<em>([^<]+)<\/em>/;
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

export async function getValgyklaUsername(
  sessionId: string,
  request?: Request
): Promise<string | null> {
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
    });
  } catch (error) {
    throw new CanteenUnavailableError(classify(error));
  }

  if (response.status !== 200) return null;

  const match = (await response.text()).match(USERNAME_PATTERN);
  return match ? match[1].trim() : null;
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
