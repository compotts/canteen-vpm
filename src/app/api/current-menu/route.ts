import { requireIdentity } from "@/server/auth";
import { getSessionId } from "@/server/valgykla-identity";
import { getAvailableMenuLink, getSessionMenu } from "@/server/menu/source";
import { errorResponse, HttpError } from "@/server/http";

export async function GET(request: Request) {
  try {
    await requireIdentity(request);
    const sessionId = getSessionId(request);
    if (!sessionId) throw new HttpError(401, "canteen session required");
    const link = await getAvailableMenuLink(sessionId);
    const menu = link ? await getSessionMenu(sessionId, link.date) : null;
    return Response.json(
      { menu },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
