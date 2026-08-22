import { HttpError } from "./http";

function parseCommaList(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function getAdminUsernames(): string[] {
  return parseCommaList(process.env.ADMIN_USERNAMES);
}

export function isAdminUsername(username: string | null | undefined): boolean {
  const normalized = String(username ?? "")
    .trim()
    .toLowerCase();
  if (!normalized) return false;
  return getAdminUsernames().includes(normalized);
}

export function getUsername(request: Request, body?: unknown): string {
  const fromHeader = request.headers.get("x-username");
  if (fromHeader?.trim()) return fromHeader.trim();

  const fromQuery = new URL(request.url).searchParams.get("username");
  if (fromQuery?.trim()) return fromQuery.trim();

  if (body && typeof body === "object" && "username" in body) {
    const value = (body as { username?: unknown }).username;
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return "";
}

export function requireUsername(request: Request, body?: unknown): string {
  const username = getUsername(request, body);
  if (!username) throw new HttpError(400, "username is required");
  return username;
}

export function assertAdmin(username: string): void {
  if (!isAdminUsername(username)) throw new HttpError(403, "forbidden");
}

export function requireAdmin(request: Request, body?: unknown): string {
  const username = getUsername(request, body);
  assertAdmin(username);
  return username;
}
