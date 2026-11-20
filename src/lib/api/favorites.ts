import { apiFetch } from "./client";
import type { FavoriteResult, FavoritesResponse } from "@/lib/favorites";

export function loadFavorites(signal?: AbortSignal): Promise<FavoritesResponse> {
  return apiFetch("/api/favorites", { cache: "no-store", signal });
}

export function saveFavorite(
  name: string,
  isFavorite: boolean,
  signal?: AbortSignal
): Promise<FavoriteResult> {
  return apiFetch("/api/favorites", {
    method: "PUT",
    body: { name, isFavorite },
    signal,
  });
}
