import { z } from "zod";
import { canteenTime, addMenuDays } from "@/lib/menu-dates";
import { getMenuArchive } from "@/server/queries/menu-archive";
import { errorResponse, HttpError, parse } from "@/server/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const today = canteenTime().date;
    const from = parse(
      z.iso.date(),
      searchParams.get("from") ?? addMenuDays(today, -7),
    );
    const to = parse(
      z.iso.date(),
      searchParams.get("to") ?? addMenuDays(today, 3),
    );
    if (from > to || to > addMenuDays(from, 61))
      throw new HttpError(400, "invalid archive date range");
    return Response.json(
      { menus: await getMenuArchive(from, to) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
