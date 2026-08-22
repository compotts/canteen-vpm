import { desc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { orderHistory } from "@/server/db/schema";
import type { OrderRecord } from "@/types/api";

type OrderRow = typeof orderHistory.$inferSelect;

export function formatOrder(row: OrderRow): OrderRecord {
  return {
    id: row.id,
    username: row.username,
    menuDate: row.menuDate,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    items: Array.isArray(row.items) ? row.items : [],
    orderTotal: Number(row.orderTotal),
  };
}

export async function getOrderHistory(username: string): Promise<OrderRecord[]> {
  const rows = await db
    .select()
    .from(orderHistory)
    .where(eq(orderHistory.username, username))
    .orderBy(desc(orderHistory.createdAt));
  return rows.map(formatOrder);
}
