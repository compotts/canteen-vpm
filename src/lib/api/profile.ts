import { apiFetch } from "./client";
import type { UserProfile } from "@/types/api";

export function loadUserProfile(signal?: AbortSignal): Promise<UserProfile> {
  return apiFetch("/api/profile", { cache: "no-store", signal });
}
