import { VALGYKLA_API_BASE } from "@/lib/constants";
import { ApiError } from "@/lib/api/client";

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
    if (response.status === 401) throw new ApiError(401, "unauthorized");
    throw new ApiError(response.status, html || `HTTP ${response.status}`);
  }
  if (hasLoginError(html)) {
    throw new ApiError(401, "Klaidingi prisijungimo duomenys");
  }
}

export async function checkAuth(): Promise<void> {
  const response = await fetch(`${VALGYKLA_API_BASE}/main/rules`, {
    method: "GET",
    credentials: "include",
  });
  assertAuthorized(response);
}

export async function getOrderMakePage(): Promise<string> {
  const response = await fetch(`${VALGYKLA_API_BASE}/orders/make`, {
    method: "GET",
    credentials: "include",
  });
  assertAuthorized(response);
  return response.text();
}

export async function getOrderPage(date: string): Promise<string> {
  const response = await fetch(`${VALGYKLA_API_BASE}/orders/make/${date}`, {
    method: "GET",
    credentials: "include",
  });
  assertAuthorized(response);
  return response.text();
}

export async function submitOrder(
  date: string,
  quantities: Record<string, string>
): Promise<void> {
  const body = new URLSearchParams();
  for (const [id, value] of Object.entries(quantities)) {
    body.set(
      `quantities[${id}]`,
      value === "" || value == null ? "" : String(value).replace(",", ".")
    );
  }

  const response = await fetch(`${VALGYKLA_API_BASE}/orders/make/${date}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    credentials: "include",
  });
  assertAuthorized(response);
}
