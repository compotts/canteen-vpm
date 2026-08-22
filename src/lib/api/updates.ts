import { apiFetch } from "./client";
import type { AppUpdate, UpdateText } from "@/types/api";

export type UpdateInput = {
  id?: string;
  version: string | null;
  dateLabel: string | null;
  emoji: string | null;
  text: UpdateText;
};

export function loadUpdates(): Promise<AppUpdate[]> {
  return apiFetch<AppUpdate[]>("/api/updates");
}

export function createUpdate(payload: UpdateInput): Promise<AppUpdate> {
  return apiFetch<AppUpdate>("/api/updates", { method: "POST", body: payload });
}

export function updateUpdate(payload: UpdateInput): Promise<AppUpdate> {
  return apiFetch<AppUpdate>("/api/updates", {
    method: "PATCH",
    body: payload,
  });
}

export function deleteUpdate(id: string): Promise<null> {
  return apiFetch<null>(`/api/updates?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
