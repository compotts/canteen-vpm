import { eq, inArray } from "drizzle-orm";
import { requireAdmin } from "@/server/auth";
import { recordActivity } from "@/server/activity";
import { db } from "@/server/db";
import { activityLogs, webPushSubscriptions } from "@/server/db/schema";
import { deliverBroadcast } from "@/server/broadcast";
import { configureWebPush } from "@/server/web-push";
import { errorResponse, HttpError, parse, readJson } from "@/server/http";
import {
  broadcastSchema,
  type BroadcastInput,
  type BroadcastResult,
} from "@/lib/broadcast";

export const runtime = "nodejs";
export const maxDuration = 60;

async function previousResult(
  input: BroadcastInput,
  username: string,
): Promise<BroadcastResult | null> {
  const [entry] = await db
    .select()
    .from(activityLogs)
    .where(eq(activityLogs.id, input.id))
    .limit(1);
  if (!entry) return null;
  if (
    entry.action !== "notification_broadcast" ||
    entry.username !== username ||
    entry.details.title !== input.title ||
    entry.details.body !== input.body
  )
    throw new HttpError(409, "broadcast ID already used");
  const details = entry.details;
  return {
    id: input.id,
    state:
      entry.status === "pending" || entry.status === "unknown"
        ? "pending"
        : "complete",
    total: Number(details.total) || 0,
    sent: Number(details.sent) || 0,
    failed: Number(details.failed) || 0,
    expired: Number(details.expired) || 0,
  };
}

function response(result: BroadcastResult) {
  return Response.json(result, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST(request: Request): Promise<Response> {
  try {
    const { username } = await requireAdmin(request, "updates");
    const input = parse(broadcastSchema, await readJson(request));
    const previous = await previousResult(input, username);
    if (previous) return response(previous);
    try {
      configureWebPush();
    } catch {
      throw new HttpError(503, "push notifications are not configured", {
        code: "push_not_configured",
      });
    }
    const recipients = await db
      .select()
      .from(webPushSubscriptions)
      .where(eq(webPushSubscriptions.enabled, true));
    let entry;
    try {
      [entry] = await recordActivity(
        {
          id: input.id,
          username,
          category: "admin",
          action: "notification_broadcast",
          status: "pending",
          target: input.title,
          details: {
            title: input.title,
            body: input.body,
            total: recipients.length,
          },
        },
        request,
      );
    } catch (error) {
      const concurrent = await previousResult(input, username);
      if (concurrent) return response(concurrent);
      throw error;
    }
    const { expiredIds, ...result } = await deliverBroadcast(recipients, input);
    if (expiredIds.length) {
      try {
        await db
          .delete(webPushSubscriptions)
          .where(inArray(webPushSubscriptions.id, expiredIds));
      } catch {
        console.error("Failed to remove expired broadcast subscriptions");
      }
    }
    await db
      .update(activityLogs)
      .set({
        status: result.failed ? "failed" : "success",
        details: { ...entry.details, ...result },
      })
      .where(eq(activityLogs.id, input.id));
    return response({ id: input.id, state: "complete", ...result });
  } catch (error) {
    return errorResponse(error);
  }
}
