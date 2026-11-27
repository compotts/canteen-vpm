import { apiFetch } from "./client";
import type { SiteContent, SiteContentKey } from "@/lib/site-content";
import type { UpdateText } from "@/types/api";

export function loadSiteContent(signal?: AbortSignal): Promise<SiteContent[]> {
  return apiFetch("/api/site-content", { cache: "no-store", signal });
}

export function saveSiteContent(key: SiteContentKey, text: UpdateText): Promise<SiteContent> {
  return apiFetch("/api/site-content", { method: "PUT", body: { key, text } });
}
