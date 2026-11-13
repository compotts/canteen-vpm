import { normalizeDishName } from "@/lib/text";
import type { Dish, Translation } from "@/types/api";
import type { DishTranslationMap } from "./types";

let cache: DishTranslationMap | null = null;

function addToMap(
  map: DishTranslationMap,
  list: (Dish | Translation)[] | undefined
): void {
  if (!Array.isArray(list)) return;

  for (const entry of list) {
    if (!entry?.name) continue;
    const key = normalizeDishName(entry.name);
    map[key] = {
      ru: entry.nameRu || entry.name,
      en: entry.nameEn || entry.name,
      photo: entry.photoUrl || map[key]?.photo || null,
    };
  }
}

async function loadEntries(path: string): Promise<(Dish | Translation)[]> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${path}`);

  const entries: unknown = await response.json();
  if (!Array.isArray(entries)) throw new Error(`Invalid dish list: ${path}`);
  return entries;
}

export async function loadDishTranslations(): Promise<DishTranslationMap> {
  if (cache) return cache;

  const results = await Promise.allSettled([
    loadEntries("/api/dishes"),
    loadEntries("/api/translations"),
  ]);

  const map: DishTranslationMap = {};
  for (const result of results) {
    if (result.status === "fulfilled") {
      addToMap(map, result.value);
    } else {
      console.error("Error loading translations:", result.reason);
    }
  }

  if (results.every((result) => result.status === "fulfilled")) cache = map;
  return map;
}
