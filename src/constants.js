export const LANG_STORAGE_KEY = 'valgyklos_lang';
export const THEME_STORAGE_KEY = 'valgyklos_theme';
export const AUTH_TOKEN_STORAGE_KEY = 'valgyklos_access_token';

export const DEFAULT_LANG = 'lt';
export const SUPPORTED_LANGS = ['ru', 'lt', 'en'];
export const LANGS = [
  { code: 'lt', label: 'LT' },
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
];
export const LOCALE_MAP = { 
  lt: 'lt-LT', 
  ru: 'ru-RU', 
  en: 'en-US' 
};

export const API_BASE = import.meta.env.VITE_API_BASE ?? '';
