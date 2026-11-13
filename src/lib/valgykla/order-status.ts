import { normalizeDishName } from "@/lib/text";
import type { DishTranslationMap, Menu } from "./types";
import { getOrderMakePage, getOrderPage } from "./client";
import { parseMenuFromHtml, parseOrderMakeLink } from "./parse";
import { loadDishTranslations } from "./translations";

export type CurrentOrder = {
  date: string;
  items: {
    id: number;
    name: string;
    weight: string;
    quantity: number;
    total: number;
  }[];
  total: number;
};

export function buildCurrentOrder(
  menu: Menu,
  translations: DishTranslationMap,
  locale: string
): CurrentOrder {
  if (!menu.sections.some((section) => section.items.length > 0)) {
    throw new Error("Menu has no dishes");
  }

  const items = menu.sections.flatMap((section) =>
    section.items.flatMap((item) => {
      const value = item.initialQuantity.trim().replace(",", ".");
      const quantity = value === "" ? 0 : Number(value);
      if (!Number.isFinite(quantity) || quantity < 0 || !Number.isFinite(item.price)) {
        throw new Error("Invalid order data");
      }
      if (quantity === 0) return [];

      const translation = translations[normalizeDishName(item.name)];
      const name = locale === "ru" ? translation?.ru : locale === "en" ? translation?.en : null;
      return [{
        id: item.id,
        name: name || item.name,
        weight: item.weight || "",
        quantity,
        total: item.price * quantity,
      }];
    })
  );

  return {
    date: menu.date,
    items,
    total: items.reduce((sum, item) => sum + item.total, 0),
  };
}

export async function loadCurrentOrder(
  locale: string,
  signal?: AbortSignal
): Promise<CurrentOrder | null> {
  const html = await getOrderMakePage(signal);
  signal?.throwIfAborted();
  const link = parseOrderMakeLink(html);
  if (!link) return null;

  const [menuHtml, translations] = await Promise.all([
    getOrderPage(link.date, signal),
    loadDishTranslations(),
  ]);
  signal?.throwIfAborted();
  return buildCurrentOrder(parseMenuFromHtml(menuHtml, link.date), translations, locale);
}
