import { apiFetch } from "./client";
import type { OrderItem, OrderRecord } from "@/types/api";

export type OrderInput = {
  menuDate: string;
  items: OrderItem[];
  orderTotal: number;
};

export function loadOrderHistory(): Promise<OrderRecord[]> {
  return apiFetch<OrderRecord[]>("/api/history");
}

export function saveOrderToHistory(order: OrderInput): Promise<OrderRecord> {
  return apiFetch<OrderRecord>("/api/history", {
    method: "POST",
    body: order,
  });
}

export function updateOrderItemQuantity(
  menuDate: string,
  itemId: OrderItem["id"],
  nextQuantity: number
): Promise<OrderRecord | null> {
  return apiFetch<OrderRecord | null>("/api/history", {
    method: "PATCH",
    body: { menuDate, itemId, nextQuantity },
  });
}

export function removeOrderByMenuDate(menuDate: string): Promise<null> {
  return apiFetch<null>(
    `/api/history?menuDate=${encodeURIComponent(menuDate)}`,
    { method: "DELETE" }
  );
}

export function clearOrderHistory(): Promise<null> {
  return apiFetch<null>("/api/history", { method: "DELETE" });
}
