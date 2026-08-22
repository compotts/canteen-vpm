const VALGYKLA_ORIGIN =
  process.env.VALGYKLA_ORIGIN ?? "https://valgykla.vpm.lt";
const SESSION_COOKIE = "PHPSESSID";
const USERNAME_PATTERN =
  /<div id="userinfo">[\s\S]*?<div class="name">[\s\S]*?<em>([^<]+)<\/em>/;

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

  const response = await fetch(`${VALGYKLA_ORIGIN}/`, {
    headers,
    redirect: "manual",
    cache: "no-store",
  });

  if (response.status !== 200) return null;

  const match = (await response.text()).match(USERNAME_PATTERN);
  return match ? match[1].trim() : null;
}
