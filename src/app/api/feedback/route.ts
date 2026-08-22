import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { feedback } from "@/server/db/schema";
import { formatFeedback, getFeedback } from "@/server/queries/feedback";
import { getIdentity, requireAdmin } from "@/server/auth";
import {
  HttpError,
  errorResponse,
  json,
  noContent,
  parse,
  readJson,
} from "@/server/http";
import { feedbackCreateSchema } from "@/lib/validators";

function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded?.trim()) return forwarded.split(",")[0].trim();

  const real = request.headers.get("x-real-ip");
  return real?.trim() ? real.trim() : null;
}

export async function GET(request: Request): Promise<Response> {
  try {
    await requireAdmin(request, "feedback");
    return json(await getFeedback());
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await readJson(request);
    const username = await getIdentity(request);
    const input = parse(feedbackCreateSchema, body);

    const [row] = await db
      .insert(feedback)
      .values({
        id: crypto.randomUUID(),
        username,
        message: input.message,
        ip: getClientIp(request),
        userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
      })
      .returning();

    return json(formatFeedback(row), 201);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    await requireAdmin(request, "feedback");

    const id = new URL(request.url).searchParams.get("id");
    if (!id) throw new HttpError(400, "id is required");

    await db.delete(feedback).where(eq(feedback.id, id));
    return noContent();
  } catch (error) {
    return errorResponse(error);
  }
}
