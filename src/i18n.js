import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ru from "./locales/ru.json";
import en from "./locales/en.json";
import lt from "./locales/lt.json";
import { LANG_STORAGE_KEY, DEFAULT_LANG, SUPPORTED_LANGS } from "./constants.js";

function getInitialLang() {
  if (typeof window === "undefined") return DEFAULT_LANG;
  const saved = localStorage.getItem(LANG_STORAGE_KEY);
  return saved && SUPPORTED_LANGS.includes(saved) ? saved : DEFAULT_LANG;
}

i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    en: { translation: en },
    lt: { translation: lt },
  },
  lng: getInitialLang(),
  fallbackLng: DEFAULT_LANG,
  supportedLngs: SUPPORTED_LANGS,
  interpolation: { escapeValue: false },
});

export default i18n;
