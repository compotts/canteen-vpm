import { normalizeDishName } from "./text";

export type FavoritesResponse = {
  keys: string[];
};

export type FavoriteResult = {
  key: string;
  isFavorite: boolean;
};

export function favoriteKey(name: string): string {
  return normalizeDishName(name.trim());
}
