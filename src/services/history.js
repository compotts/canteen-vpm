import { SAVED_USERNAME_KEY, API_BASE } from "../constants";



function getUsername() {
  return (localStorage.getItem(SAVED_USERNAME_KEY) || "").trim();
}

async function request(url, options = {}) {
  const username = getUsername();

  if (!username) {
    throw new Error("No username found");
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-username": username,
      ...(options.headers || {}),
    },
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }

  return data;
}

export async function loadOrderHistory() {
  return request(API_BASE, { method: "GET" });
}

export async function saveOrderToHistory(order) {
  return request(API_BASE, {
    method: "POST",
    body: JSON.stringify(order),
  });
}

export async function updateOrderItemQuantityByMenuDate(menuDate, itemId, nextQuantity) {
  return request(API_BASE, {
    method: "PATCH",
    body: JSON.stringify({ menuDate, itemId, nextQuantity }),
  });
}

export async function removeOrderFromHistoryByMenuDate(menuDate) {
  return request(`${API_BASE}?menuDate=${encodeURIComponent(menuDate)}`, {
    method: "DELETE",
  });
}

export async function clearOrderHistory() {
  return request(API_BASE, { method: "DELETE" });
}