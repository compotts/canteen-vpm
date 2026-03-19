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

function roundToStep(value, step) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  if (typeof step !== "number" || !Number.isFinite(step) || step <= 0) return value;
  return Math.round(value / step) * step;
}

export function updateOrderItemQuantityByMenuDate(menuDate, itemId, nextQuantity) {
  if (!menuDate || !itemId) return;
  if (typeof window === "undefined" || !window.localStorage) return;

  try {
    const existing = loadOrderHistory();
    const idx = existing.findIndex((o) => o && o.menuDate === menuDate);
    if (idx < 0) return;

    const order = existing[idx];
    const items = Array.isArray(order.items) ? order.items : [];
    const q = roundToStep(Number(nextQuantity) || 0, 0.5);
    const nextItems = items
      .map((it) => {
        if (!it || it.id !== itemId) return it;
        if (q <= 0) return null;
        const pricePerUnit = typeof it.pricePerUnit === "number" ? it.pricePerUnit : 0;
        return {
          ...it,
          quantity: q,
          totalPrice: pricePerUnit * q,
        };
      })
      .filter(Boolean);

    if (nextItems.length === 0) {
      const filtered = existing.filter((o) => !o || o.menuDate !== menuDate);
      window.localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(filtered));
      return;
    }

    const orderTotal = nextItems.reduce((sum, it) => {
      const tp = typeof it.totalPrice === "number" ? it.totalPrice : 0;
      return sum + tp;
    }, 0);

    const updated = {
      ...order,
      items: nextItems,
      orderTotal,
      updatedAt: new Date().toISOString(),
    };

    const next = [...existing];
    next[idx] = updated;
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

