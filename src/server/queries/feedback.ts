import { desc } from "drizzle-orm";
import { db } from "@/server/db";
import { feedback } from "@/server/db/schema";
import type { FeedbackEntry } from "@/types/api";

type FeedbackRow = typeof feedback.$inferSelect;

export function formatFeedback(row: FeedbackRow): FeedbackEntry {
  return {
    id: row.id,
    username: row.username,
    message: row.message,
    ip: row.ip,
    userAgent: row.userAgent,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getFeedback(): Promise<FeedbackEntry[]> {
  const rows = await db
    .select()
    .from(feedback)
    .orderBy(desc(feedback.createdAt))
    .limit(200);
  return rows.map(formatFeedback);
}
