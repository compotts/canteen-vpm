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

export async function loadDishTranslations(): Promise<DishTranslationMap> {
  if (cache) return cache;

  try {
    const [dishesResponse, translationsResponse] = await Promise.all([
      fetch("/api/dishes"),
      fetch("/api/translations"),
    ]);

    const map: DishTranslationMap = {};
    if (dishesResponse.ok) addToMap(map, await dishesResponse.json());
    if (translationsResponse.ok) addToMap(map, await translationsResponse.json());

    cache = map;
    return cache;
  } catch (error) {
    console.error("Error loading translations:", error);
    return {};
  }
}
