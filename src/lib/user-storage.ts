import { SAVED_USERNAME_KEY } from "./constants";

export function getStoredUsername(): string {
  try {
    return (localStorage.getItem(SAVED_USERNAME_KEY) || "").trim();
  } catch {
    return "";
  }
}
