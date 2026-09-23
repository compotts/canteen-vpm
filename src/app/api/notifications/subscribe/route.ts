import { and, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { requireIdentity } from "@/server/auth";
import { webPushSubscriptions } from "@/server/db/schema";
import { errorResponse, HttpError, json, noContent, readJson } from "@/server/http";

// const subscriptionSchema = {
//   endpoint: "endpoint",
//   keys: {
//     p256dh: "p256dh",
//     auth: "auth",
//   },
// } as const;

type SubscriptionBody = {
  endpoint?: unknown;
  keys?: {
    p256dh?: unknown;
    auth?: unknown;
  };
};

function parseSubscription(body: SubscriptionBody ): {
  endpoint: string;
  p256dh: string;
  auth: string;
} {
  const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
  const p256dh = typeof body.keys?.p256dh === "string" ? body.keys.p256dh : "";
  const auth = typeof body.keys?.auth === "string" ? body.keys.auth : "";

  if (!endpoint || !p256dh || !auth || endpoint.length > 2048) {
    throw new HttpError(400, "Invalid push subscription");
  }

  return { endpoint, p256dh, auth };
}

export async function POST(request: Request): Promise<Response> {
  try {
    const username = await requireIdentity(request);
    const body = (await readJson(request)) as SubscriptionBody;
    const subscription = parseSubscription(body);

    await db
      .insert(webPushSubscriptions)
      .values({ username, ...subscription, enabled: true })
      .onConflictDoUpdate({
        target: webPushSubscriptions.endpoint,
        set: {
          username,
          p256dh: subscription.p256dh,
          auth: subscription.auth,
          enabled: true,
          updatedAt: new Date(),
        },
      });

    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    const username = await requireIdentity(request);
    const body = (await readJson(request)) as { endpoint?: unknown };
    const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
    if (!endpoint) throw new HttpError(400, "Endpoint is required");

    await db
      .delete(webPushSubscriptions)
      .where(
        and(
          eq(webPushSubscriptions.username, username),
          eq(webPushSubscriptions.endpoint, endpoint)
        )
      );

    return noContent();
  } catch (error) {
    return errorResponse(error);
  }
}