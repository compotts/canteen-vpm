export const VALGYKLA_API_BASE = "/valgykla";

export const REMEMBER_ME_KEY = "valgyklos_remember_me";
export const SAVED_USERNAME_KEY = "valgyklos_username";
export const SAVED_PASSWORD_KEY = "valgyklos_password";
export const THEME_STORAGE_KEY = "valgyklos_theme";

export const CATEGORY_IDS = [
  "sriubos",
  "main",
  "salotos",
  "drinks",
  "other",
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export const SECTION_TITLE_KEYS: Record<string, string> = {
  "dienos meniu": "menu.dailyMenu",
  sriubos: "catalog.category.sriubos",
  "pagrindiniai patiekalai": "catalog.category.main",
  salotos: "catalog.category.salotos",
  gėrimai: "catalog.category.drinks",
  kita: "catalog.category.other",
};
