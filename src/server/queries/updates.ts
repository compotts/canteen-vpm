import { desc } from "drizzle-orm";
import { db } from "@/server/db";
import { appUpdates } from "@/server/db/schema";
import type { AppUpdate } from "@/types/api";

type AppUpdateRow = typeof appUpdates.$inferSelect;

export function formatUpdate(row: AppUpdateRow): AppUpdate {
  return {
    id: row.id,
    username: row.username,
    version: row.version,
    dateLabel: row.dateLabel,
    emoji: row.emoji,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    text: {
      lt: row.textLt ?? "",
      ru: row.textRu ?? "",
      en: row.textEn ?? "",
    },
  };
}

export async function getUpdates(): Promise<AppUpdate[]> {
  const rows = await db
    .select()
    .from(appUpdates)
    .orderBy(desc(appUpdates.createdAt))
    .limit(50);
  return rows.map(formatUpdate);
}
