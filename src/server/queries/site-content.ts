import { db } from "@/server/db";
import { siteContent } from "@/server/db/schema";
import { SITE_CONTENT_KEYS, type SiteContent, type SiteContentKey } from "@/lib/site-content";

type ContentRow = typeof siteContent.$inferSelect;

export function formatSiteContent(row: ContentRow): SiteContent {
  return {
    key: row.key as SiteContentKey,
    text: { lt: row.textLt, ru: row.textRu, en: row.textEn },
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getSiteContent(): Promise<SiteContent[]> {
  const rows = await db.select().from(siteContent);
  return SITE_CONTENT_KEYS.map((key) => {
    const row = rows.find((entry) => entry.key === key);
    return row
      ? formatSiteContent(row)
      : { key, text: { lt: "", ru: "", en: "" }, updatedAt: null };
  });
}
