import { and, asc, gte, lte } from "drizzle-orm";
import { db } from "@/server/db";
import { dailyMenus } from "@/server/db/schema";
import type { ArchivedMenu, ArchivedMenuSection } from "@/lib/menu-archive";

export async function getMenuArchive(from: string, to: string): Promise<ArchivedMenu[]> {
  const rows = await db
    .select()
    .from(dailyMenus)
    .where(and(gte(dailyMenus.date, from), lte(dailyMenus.date, to)))
    .orderBy(asc(dailyMenus.date))
    .limit(62);
  return rows.map((row) => ({
    date: row.date,
    sections: row.sections,
    capturedAt: row.capturedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function saveMenuSnapshot(
  date: string,
  sections: ArchivedMenuSection[]
): Promise<void> {
  await db
    .insert(dailyMenus)
    .values({ date, sections })
    .onConflictDoUpdate({ target: dailyMenus.date, set: { sections, updatedAt: new Date() } });
}
