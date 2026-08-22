import { asc } from "drizzle-orm";
import { db } from "@/server/db";
import { dishes } from "@/server/db/schema";
import type { Dish } from "@/types/api";

type DishRow = typeof dishes.$inferSelect;

export function formatDish(row: DishRow): Dish {
  return {
    id: row.id,
    category: row.category,
    name: row.nameLt,
    nameRu: row.nameRu,
    nameEn: row.nameEn,
    weight: row.weight,
    priceStudent: row.priceStudent === null ? null : Number(row.priceStudent),
    priceTeacher: row.priceTeacher === null ? null : Number(row.priceTeacher),
    photoUrl: row.photoUrl,
  };
}

export async function getDishes(): Promise<Dish[]> {
  const rows = await db
    .select()
    .from(dishes)
    .orderBy(asc(dishes.category), asc(dishes.id));
  return rows.map(formatDish);
}
