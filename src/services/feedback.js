import { getStoredUsername } from "./userStorage.js";

const FEEDBACK_API_BASE = "/api/feedback";

async function request(path, options = {}) {
  const username = getStoredUsername();
  const res = await fetch(`${FEEDBACK_API_BASE}${path}`, {
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

export function sendFeedback(message) {
  return request("", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export function loadFeedback() {
  return request("", { method: "GET" });
}

export function deleteFeedback(id) {
  const q = `?id=${encodeURIComponent(id)}`;
  return request(q, { method: "DELETE" });
}
