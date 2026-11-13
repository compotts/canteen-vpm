import type { BatchItem } from "drizzle-orm/batch";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { activityLogs } from "./db/schema";

type ActivityInput = typeof activityLogs.$inferInsert;

export function recordActivity(input: ActivityInput) {
  return db.insert(activityLogs).values(input).returning();
}

export async function auditMutation<T extends BatchItem<"pg">>(
  mutation: T,
  activity: ActivityInput
): Promise<T["_"]["result"]> {
  const id = crypto.randomUUID();
  const [result] = await db.batch([
    mutation,
    db.insert(activityLogs).values({ ...activity, id }),
  ]);
  if (Array.isArray(result) && result.length === 0) {
    await db.update(activityLogs).set({ status: "failed" }).where(eq(activityLogs.id, id));
  }
  return result;
}
