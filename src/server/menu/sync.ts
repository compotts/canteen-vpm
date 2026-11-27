import { timingSafeEqual } from "node:crypto";
import {
  createMenuSourceSession,
  menuLinkFromHtml,
  archiveSections,
} from "@/server/menu/source";
import { saveMenuSnapshot } from "@/server/queries/menu-archive";
import { canteenTime } from "@/lib/menu-dates";
import { HttpError } from "@/server/http";

export async function syncMenu(request: Request): Promise<Response> {
  const expected = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization") ?? "";
  if (
    !expected ||
    Buffer.byteLength(authorization) !==
      Buffer.byteLength(`Bearer ${expected}`) ||
    !timingSafeEqual(
      Buffer.from(authorization),
      Buffer.from(`Bearer ${expected}`),
    )
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const session = await createMenuSourceSession();
    const link = menuLinkFromHtml(await session.get("/orders/make"));
    if (!link || link.date < canteenTime().date)
      return Response.json({ ok: true, skipped: "no available menu" });
    const sections = archiveSections(
      await session.get(`/orders/make/${link.date}`),
      link.date,
    );
    await saveMenuSnapshot(link.date, sections);
    return Response.json({
      ok: true,
      date: link.date,
      dishes: sections.reduce((sum, section) => sum + section.items.length, 0),
    });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 502;
    return Response.json(
      {
        error:
          status === 503
            ? "menu sync is not configured or canteen is unavailable"
            : "menu sync failed",
      },
      { status },
    );
  }
}
