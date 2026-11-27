export const INTERFACE_KEY = "valgyklos_interface";
export type InterfaceDesign = "new" | "old";

export function rememberInterface(value: InterfaceDesign) {
  try {
    localStorage.setItem(INTERFACE_KEY, value);
  } catch {}
  document.cookie = `${INTERFACE_KEY}=${value}; Path=/; Max-Age=31536000; SameSite=Lax`;
  window.dispatchEvent(new Event("interface-change"));
}

export function legacyPath(path: string) {
  return path === "/" ? "/old-design" : `/old-design${path}`;
}
