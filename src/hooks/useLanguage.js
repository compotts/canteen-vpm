import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { LANG_STORAGE_KEY, LANGS, DEFAULT_LANG } from "../constants.js";

export function useLanguage() {
  const { i18n } = useTranslation();
  const lang = i18n.language || DEFAULT_LANG;

  const setLang = useCallback(
    (code) => {
      if (!LANGS.some((l) => l.code === code)) return;
      i18n.changeLanguage(code);
      try {
        localStorage.setItem(LANG_STORAGE_KEY, code);
        if (typeof document !== "undefined") document.documentElement.lang = code;
      } catch (e) {}
    },
    [i18n]
  );

  return { lang, setLang, langs: LANGS };
}
