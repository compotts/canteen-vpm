import { and, desc, eq, inArray, lt, or, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { ACTIVITY_ACTIONS, ACTIVITY_STATUSES, activityFullName } from "@/lib/activity";
import { requireAdmin } from "@/server/auth";
import { db } from "@/server/db";
import { activityLogs } from "@/server/db/schema";
import { errorResponse, HttpError, json, parse } from "@/server/http";
import { normalizeUsername } from "@/server/queries/admins";

const filtersSchema = z.object({
  category: z.enum(["orders", "admin"]).optional(),
  action: z.enum(ACTIVITY_ACTIONS).optional(),
  status: z.enum(ACTIVITY_STATUSES).optional(),
  username: z.string().trim().min(1).max(64).optional(),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  cursor: z.string().max(512).optional(),
});

const cursorSchema = z.object({
  createdAt: z.iso.datetime(),
  id: z.uuid(),
});

export async function GET(request: Request): Promise<Response> {
  try {
    await requireAdmin(request, "logs");
    const filters = parse(filtersSchema, Object.fromEntries(new URL(request.url).searchParams));
    if (filters.from && filters.to && filters.from > filters.to) {
      throw new HttpError(400, "invalid date range");
    }

    const conditions: SQL[] = [];
    if (filters.category) conditions.push(eq(activityLogs.category, filters.category));
    if (filters.action) conditions.push(eq(activityLogs.action, filters.action));
    if (filters.status) conditions.push(eq(activityLogs.status, filters.status));
    if (filters.username) conditions.push(eq(activityLogs.username, normalizeUsername(filters.username)));
    if (filters.from) {
      conditions.push(sql`${activityLogs.createdAt} >= (${filters.from}::date::timestamp AT TIME ZONE 'Europe/Vilnius')`);
    }
    if (filters.to) {
      conditions.push(sql`${activityLogs.createdAt} < ((${filters.to}::date + interval '1 day') AT TIME ZONE 'Europe/Vilnius')`);
    }
    if (filters.cursor) {
      let decoded: unknown;
      try {
        decoded = JSON.parse(Buffer.from(filters.cursor, "base64url").toString());
      } catch {
        throw new HttpError(400, "invalid cursor");
      }
      const cursor = parse(cursorSchema, decoded);
      conditions.push(or(
        lt(activityLogs.createdAt, new Date(cursor.createdAt)),
        and(eq(activityLogs.createdAt, new Date(cursor.createdAt)), lt(activityLogs.id, cursor.id))
      )!);
    }

    const rows = await db.select().from(activityLogs)
      .where(and(...conditions))
      .orderBy(desc(activityLogs.createdAt), desc(activityLogs.id))
      .limit(51);
    const page = rows.slice(0, 50);
    const missingNames = [...new Set(page.filter((row) => !activityFullName(row.details)).map((row) => row.username))];
    const knownNames = missingNames.length
      ? await db.selectDistinctOn([activityLogs.username], {
          username: activityLogs.username,
          fullName: sql<string>`${activityLogs.details}->>'fullName'`,
        }).from(activityLogs).where(and(
          inArray(activityLogs.username, missingNames),
          sql`jsonb_typeof(${activityLogs.details}->'fullName') = 'string'`,
          sql`length(trim(${activityLogs.details}->>'fullName')) > 0`
        )).orderBy(activityLogs.username, desc(activityLogs.createdAt), desc(activityLogs.id))
      : [];
    const names = new Map(knownNames.map((row) => [row.username, row.fullName.trim()]));
    const entries = page.map((row) => ({
      ...row,
      fullName: activityFullName(row.details) ?? names.get(row.username) ?? null,
      createdAt: row.createdAt.toISOString(),
    }));
    const last = entries.at(-1);
    const nextCursor = rows.length > 50 && last
      ? Buffer.from(JSON.stringify({ id: last.id, createdAt: last.createdAt })).toString("base64url")
      : null;

    const response = json({ entries, nextCursor });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
