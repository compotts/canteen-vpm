import { VALGYKLA_BASE } from "../constants.js";

const rawBase = VALGYKLA_BASE.replace(/\/$/, "");
const base = import.meta.env.DEV ? "/valgykla" : rawBase;

function handleResponse(res) {
  if (res.status === 401) {
    const err = new Error("unauthorized");
    err.status = 401;
    throw err;
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function login(username, password) {
  const res = await fetch(`${base}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username, password }),
    credentials: "include",
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("unauthorized");
    throw new Error(await res.text() || "HTTP " + res.status);
  }
}

export async function checkAuth() {
  const res = await fetch(`${base}/main/rules`, { method: "GET", credentials: "include" });
  handleResponse(res);
}

export async function getOrderMakePage() {
  const res = await fetch(`${base}/orders/make`, { method: "GET", credentials: "include" });
  handleResponse(res);
  return res.text();
}

export async function getOrderPage(dateStr) {
  const res = await fetch(`${base}/orders/make/${dateStr}`, { method: "GET", credentials: "include" });
  handleResponse(res);
  return res.text();
}

export async function submitOrder(dateStr, quantities) {
  const body = new URLSearchParams();
  Object.entries(quantities).forEach(([id, value]) => {
    const v = value === "" || value == null ? "" : String(value).replace(",", ".");
    body.set(`quantities[${id}]`, v);
  });
  const res = await fetch(`${base}/orders/make/${dateStr}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    credentials: "include",
  });
  handleResponse(res);
}
