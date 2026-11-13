import { eq } from "drizzle-orm";
import { z } from "zod";
import { recordActivity } from "@/server/activity";
import { requireIdentity } from "@/server/auth";
import { db } from "@/server/db";
import { activityLogs } from "@/server/db/schema";
import { errorResponse, HttpError, json, parse, readJson } from "@/server/http";
import { getSessionId } from "@/server/valgykla-identity";
import { orderResponseStatus } from "@/server/order-response";

const quantitiesSchema = z.object({
  quantities: z.record(
    z.string().regex(/^\d{1,20}$/),
    z.string().trim().max(20).refine((value) =>
      value === "" || (Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 1000)
    )
  ).refine((value) => Object.keys(value).length > 0 && Object.keys(value).length <= 500),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ date: string }> }
): Promise<Response> {
  try {
    const username = await requireIdentity(request);
    const sessionId = getSessionId(request);
    if (!sessionId) throw new HttpError(401, "canteen session required");
    const date = parse(z.iso.date(), (await context.params).date);
    const { quantities } = parse(quantitiesSchema, await readJson(request));
    const [entry] = await recordActivity({
      username,
      category: "orders",
      action: "order_submit",
      status: "pending",
      target: date,
      details: { menuDate: date, quantities },
    });

    const origin = process.env.VALGYKLA_ORIGIN ?? "https://valgykla.vpm.lt";
    const orderUrl = `${origin}/orders/make/${date}`;
    const body = new URLSearchParams();
    for (const [id, quantity] of Object.entries(quantities)) {
      body.set(`quantities[${id}]`, quantity);
    }

    let status: "success" | "failed" | "unknown" = "unknown";
    let upstreamStatus: number | null = null;
    try {
      const response = await fetch(orderUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          cookie: `PHPSESSID=${sessionId}`,
          "user-agent": request.headers.get("user-agent") ?? "canteen-vpm",
        },
        body: body.toString(),
        redirect: "manual",
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      });
      upstreamStatus = response.status;
      status = orderResponseStatus(response, await response.text(), orderUrl);
    } catch {
      status = "unknown";
    }

    try {
      await db.update(activityLogs).set({
        status,
        details: { menuDate: date, quantities, upstreamStatus },
      }).where(eq(activityLogs.id, entry.id));
    } catch (error) {
      console.error("Failed to update order activity:", error);
    }

    if (status === "unknown") {
      throw new HttpError(502, "order result unknown", { code: "order_status_unknown" });
    }
    if (status === "failed") throw new HttpError(400, "canteen rejected the order");
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
