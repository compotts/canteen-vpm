export function pickTextByLang(map, lang) {
  if (!map || typeof map !== "object") return "";
  const order = [lang, "lt", "ru", "en"];
  for (const key of order) {
    const value = map[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return "";
}
