import { apiFetch } from "./client";
import type { ArchivedMenu } from "@/lib/menu-archive";

export function loadMenuArchive(
  from: string,
  to: string,
  signal?: AbortSignal
): Promise<{ menus: ArchivedMenu[] }> {
  const params = new URLSearchParams({ from, to });
  return apiFetch(`/api/menu-archive?${params}`, { cache: "no-store", signal });
}
