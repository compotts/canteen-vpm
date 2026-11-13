import { apiFetch } from "./client";
import type { ActivityPage } from "@/lib/activity";

export function loadActivity(
  filters: Record<string, string>,
  signal?: AbortSignal
): Promise<ActivityPage> {
  const params = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value.length > 0)
  );
  return apiFetch(`/api/admin/logs?${params}`, { signal, cache: "no-store" });
}
