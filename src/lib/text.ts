import type { UpdateText } from "@/types/api";

export function normalizeDishName(name = ""): string {
  return name
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .replace(/[.,;:]+$/u, "")
    .trim()
    .toLowerCase();
}

export function pickTextByLang(
  map: UpdateText | null | undefined,
  lang: string
): string {
  if (!map) return "";
  for (const key of [lang, "lt", "ru", "en"] as const) {
    const value = map[key as keyof UpdateText];
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}
