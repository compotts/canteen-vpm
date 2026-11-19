import type { BatchItem } from "drizzle-orm/batch";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { activityLogs } from "./db/schema";
import { getUserProfile } from "./auth";
import { normalizeUsername } from "./queries/admins";

type ActivityInput = typeof activityLogs.$inferInsert;

async function withUserProfile(input: ActivityInput, request: Request): Promise<ActivityInput> {
  const profile = await getUserProfile(request);
  return {
    ...input,
    details: {
      ...input.details,
      fullName: profile?.username === normalizeUsername(input.username)
        ? profile.fullName : null,
    },
  };
}

export async function recordActivity(input: ActivityInput, request: Request) {
  return db.insert(activityLogs).values(await withUserProfile(input, request)).returning();
}

export async function auditMutation<T extends BatchItem<"pg">>(
  mutation: T,
  activity: ActivityInput,
  request: Request
): Promise<T["_"]["result"]> {
  const id = crypto.randomUUID();
  const input = await withUserProfile(activity, request);
  const [result] = await db.batch([
    mutation,
    db.insert(activityLogs).values({ ...input, id }),
  ]);
  if (Array.isArray(result) && result.length === 0) {
    await db.update(activityLogs).set({ status: "failed" }).where(eq(activityLogs.id, id));
  }
  return result;
}
