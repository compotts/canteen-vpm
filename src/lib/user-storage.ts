import { ADMIN_USERNAMES, SAVED_USERNAME_KEY } from "./constants";

export function getStoredUsername(): string {
  try {
    return (localStorage.getItem(SAVED_USERNAME_KEY) || "").trim();
  } catch {
    return "";
  }
}

export function isStoredUserAdmin(): boolean {
  const username = getStoredUsername().toLowerCase();
  if (!username) return false;
  return ADMIN_USERNAMES.includes(username);
}
