import { asc } from "drizzle-orm";
import { db } from "@/server/db";
import { translations } from "@/server/db/schema";
import type { Translation } from "@/types/api";

type TranslationRow = typeof translations.$inferSelect;

export function formatTranslation(row: TranslationRow): Translation {
  return {
    id: row.id,
    name: row.nameLt,
    nameRu: row.nameRu,
    nameEn: row.nameEn,
    photoUrl: row.photoUrl,
  };
}

export async function getTranslations(): Promise<Translation[]> {
  const rows = await db
    .select()
    .from(translations)
    .orderBy(asc(translations.id));
  return rows.map(formatTranslation);
}
