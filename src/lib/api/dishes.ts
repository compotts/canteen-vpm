import { apiFetch } from "./client";
import type { Dish } from "@/types/api";

export function loadDishes(): Promise<Dish[]> {
  return apiFetch<Dish[]>("/api/dishes");
}

export function createDish(dish: Partial<Dish>): Promise<Dish> {
  return apiFetch<Dish>("/api/dishes", { method: "POST", body: dish });
}

export function updateDish(dish: Partial<Dish>): Promise<Dish> {
  return apiFetch<Dish>("/api/dishes", { method: "PATCH", body: dish });
}

export function deleteDish(id: string): Promise<null> {
  return apiFetch<null>(`/api/dishes?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
