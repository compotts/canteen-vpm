export const locales = ["lt", "ru", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "lt";
export const localeCookie = "NEXT_LOCALE";

export const localeLabels: Record<Locale, string> = {
  lt: "LT",
  ru: "RU",
  en: "EN",
};

export const localeTags: Record<Locale, string> = {
  lt: "lt-LT",
  ru: "ru-RU",
  en: "en-US",
};
