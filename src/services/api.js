const base = "/valgykla";

function handleResponse(res) {
  if (res.status === 401) {
    const err = new Error("unauthorized");
    err.status = 401;
    throw err;
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

function parseLoginResponse(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const errorsBlock = doc.querySelector(".messages.errors");
  if (!errorsBlock) return { success: true };
  return { success: false, message: "Klaidingi prisijungimo duomenys" };
}

export async function login(username, password) {
  const res = await fetch(`${base}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username, password }),
    credentials: "include",
  });
  const html = await res.text();
  if (!res.ok) {
    if (res.status === 401) throw new Error("unauthorized");
    throw new Error(html || `HTTP ${res.status}`);
  }
  const parsed = parseLoginResponse(html);
  if (!parsed.success) throw new Error(parsed.message);
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
