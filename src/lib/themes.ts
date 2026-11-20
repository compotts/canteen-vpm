export const COLOR_THEMES = [
  { id: "neutral", light: "#f5f5f5", dark: "#09090b", accent: "#71717a" },
  { id: "sand", light: "#f6f2eb", dark: "#171411", accent: "#a87b50" },
  { id: "sage", light: "#f0f4f1", dark: "#101713", accent: "#638b73" },
  { id: "blue", light: "#eff3f8", dark: "#101620", accent: "#658ab5" },
] as const;

export type ColorTheme = (typeof COLOR_THEMES)[number]["id"];

export function getColorTheme(theme: string | undefined): ColorTheme {
  return COLOR_THEMES.find(({ id }) => theme === id || theme === `${id}-dark`)?.id ?? "neutral";
}

export function isDarkTheme(theme: string | undefined): boolean {
  return theme === "dark" || Boolean(theme?.endsWith("-dark"));
}

export function getThemeName(color: ColorTheme, dark: boolean): string {
  if (color === "neutral") return dark ? "dark" : "light";
  return dark ? `${color}-dark` : color;
}

export const THEMES = COLOR_THEMES.flatMap(({ id }) => [
  getThemeName(id, false),
  getThemeName(id, true),
]);
