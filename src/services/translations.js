import { getStoredUsername } from "./userStorage.js";

function request(method, body) {
  const headers = {
    "Content-Type": "application/json",
    "x-username": getStoredUsername() || ""
  };

  const options = {
    method,
    headers
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  return fetch("/api/translations", options)
    .then(res => {
      if (res.status === 204) return null;
      if (!res.ok) {
        return res.json().then(data => {
          throw new Error(data.error || `HTTP ${res.status}`);
        });
      }
      return res.json();
    });
}

export async function loadTranslations() {
  const res = await fetch("/api/translations");
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function createTranslation(translation) {
  return request("POST", translation);
}

export async function updateTranslation(translation) {
  return request("PATCH", translation);
}

export async function deleteTranslation(id) {
  return fetch(`/api/translations?id=${id}`, {
    method: "DELETE",
    headers: {
      "x-username": getStoredUsername() || ""
    }
  }).then(res => {
    if (!res.ok) {
      return res.json().then(data => {
        throw new Error(data.error || `HTTP ${res.status}`);
      });
    }
  });
}
