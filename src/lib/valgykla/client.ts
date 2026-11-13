import { VALGYKLA_API_BASE } from "@/lib/constants";
import { ApiError, apiFetch } from "@/lib/api/client";

export const INVALID_CREDENTIALS = "invalid_credentials";
export const CANTEEN_UNAVAILABLE = "canteen_unavailable";

function assertAuthorized(response: Response): void {
  if (response.status === 401) throw new ApiError(401, "unauthorized");
  if (!response.ok) throw new ApiError(response.status, `HTTP ${response.status}`);
}

function hasLoginError(html: string): boolean {
  return Boolean(
    new DOMParser()
      .parseFromString(html, "text/html")
      .querySelector(".messages.errors")
  );
}

export async function login(
  username: string,
  password: string
): Promise<void> {
  const response = await fetch(`${VALGYKLA_API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username, password }),
    credentials: "include",
  });

  const html = await response.text();
  if (!response.ok) {
    throw new ApiError(
      response.status,
      response.status === 401 ? INVALID_CREDENTIALS : CANTEEN_UNAVAILABLE
    );
  }
  if (hasLoginError(html)) {
    throw new ApiError(401, INVALID_CREDENTIALS);
  }
}

export async function checkAuth(): Promise<void> {
  const response = await fetch(`${VALGYKLA_API_BASE}/main/rules`, {
    method: "GET",
    credentials: "include",
  });
  assertAuthorized(response);
}

export async function getOrderMakePage(signal?: AbortSignal): Promise<string> {
  const response = await fetch(`${VALGYKLA_API_BASE}/orders/make`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    signal,
  });
  assertAuthorized(response);
  return response.text();
}

export async function getOrderPage(date: string, signal?: AbortSignal): Promise<string> {
  const response = await fetch(`${VALGYKLA_API_BASE}/orders/make/${date}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    signal,
  });
  assertAuthorized(response);
  return response.text();
}

export async function submitOrder(
  date: string,
  quantities: Record<string, string>
): Promise<void> {
  const normalized = Object.fromEntries(
    Object.entries(quantities).map(([id, value]) => [
      id,
      value == null ? "" : String(value).replace(",", "."),
    ])
  );
  await apiFetch(`/api/orders/${encodeURIComponent(date)}`, {
    method: "POST",
    body: { quantities: normalized },
  });
}
