import { getStoredUsername } from "./userStorage.js";

const UPDATES_API_BASE = "/api/updates";

async function request(path, options = {}) {
  const username = getStoredUsername();
  const res = await fetch(`${UPDATES_API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(username ? { "x-username": username } : {}),
    },
  });

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const msg = (data && data.error) || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

export function loadUpdates() {
  return request("", { method: "GET" });
}

export function createUpdate(payload) {
  return request("", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateUpdate(payload) {
  return request("", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteUpdate(id) {
  const q = `?id=${encodeURIComponent(id)}`;
  return request(q, { method: "DELETE" });
}

