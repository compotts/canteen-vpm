import type { UpdateText } from "@/types/api";

export const SITE_CONTENT_KEYS = ["about", "eco"] as const;
export type SiteContentKey = (typeof SITE_CONTENT_KEYS)[number];
export type SiteContent = {
  key: SiteContentKey;
  text: UpdateText;
  updatedAt: string | null;
};
