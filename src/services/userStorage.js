import { ADMIN_USERNAMES, SAVED_USERNAME_KEY } from "../constants.js";

export function getStoredUsername() {
  try {
    return (localStorage.getItem(SAVED_USERNAME_KEY) || "").trim();
  } catch {
    return "";
  }
}

export function isStoredUserAdmin() {
  const username = getStoredUsername().toLowerCase();
  if (!username) return false;
  return ADMIN_USERNAMES.includes(username);
}

