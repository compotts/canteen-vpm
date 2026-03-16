import { ORDER_HISTORY_KEY } from "../constants.js";

export function loadOrderHistory() {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(ORDER_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOrderToHistory(order) {
  if (!order) return;
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const existing = loadOrderHistory();
    const withId = {
      ...order,
      id: order.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    };
    const filtered = existing.filter((o) => !o || o.menuDate !== withId.menuDate);
    const next = [withId, ...filtered];
    window.localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(next));
  } catch {
  }
}

export function removeOrderFromHistoryByMenuDate(menuDate) {
  if (!menuDate) return;
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const existing = loadOrderHistory();
    const next = existing.filter((o) => !o || o.menuDate !== menuDate);
    window.localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(next));
  } catch {
  }
}

export function clearOrderHistory() {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.removeItem(ORDER_HISTORY_KEY);
  } catch {
  }
}

