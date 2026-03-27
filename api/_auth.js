function parseCommaList(raw) {
  const src = typeof raw === "string" ? raw : "";
  return src
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

export function getUsername(req) {
  const value =
    req.headers["x-username"] ||
    req.query?.username ||
    req.body?.username;

  return typeof value === "string" ? value.trim() : "";
}

export function getAdminUsernames() {
  return parseCommaList(process.env.ADMIN_USERNAMES);
}

export function isAdminUsername(username) {
  const normalized = String(username || "").trim().toLowerCase();
  if (!normalized) return false;
  return getAdminUsernames().includes(normalized);
}

