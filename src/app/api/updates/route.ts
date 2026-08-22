import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { appUpdates } from "@/server/db/schema";
import { formatUpdate, getUpdates } from "@/server/queries/updates";
import { requireAdmin } from "@/server/auth";
import {
  HttpError,
  errorResponse,
  json,
  noContent,
  parse,
  readJson,
} from "@/server/http";
import { appUpdateCreateSchema, appUpdatePatchSchema } from "@/lib/validators";
import type { UpdateText } from "@/types/api";

function textColumns(text: UpdateText) {
  return {
    textLt: text.lt || null,
    textRu: text.ru || null,
    textEn: text.en || null,
  };
}

export async function GET(): Promise<Response> {
  try {
    return json(await getUpdates());
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await readJson(request);
    const { username } = await requireAdmin(request, "updates");

    const input = parse(appUpdateCreateSchema, body);
    const [row] = await db
      .insert(appUpdates)
      .values({
        username,
        version: input.version,
        dateLabel: input.dateLabel,
        emoji: input.emoji,
        ...textColumns(input.text),
      })
      .returning();

    return json(formatUpdate(row), 201);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    const body = await readJson(request);
    await requireAdmin(request, "updates");

    const input = parse(appUpdatePatchSchema, body);
    const [row] = await db
      .update(appUpdates)
      .set({
        ...(input.version !== null && { version: input.version }),
        ...(input.dateLabel !== null && { dateLabel: input.dateLabel }),
        ...(input.emoji !== null && { emoji: input.emoji }),
        ...(input.text ? textColumns(input.text) : {}),
        updatedAt: new Date(),
      })
      .where(eq(appUpdates.id, input.id))
      .returning();

    if (!row) throw new HttpError(404, "not found");
    return json(formatUpdate(row));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    await requireAdmin(request, "updates");

    const id = new URL(request.url).searchParams.get("id");
    if (!id) throw new HttpError(400, "id is required");

    await db.delete(appUpdates).where(eq(appUpdates.id, id));
    return noContent();
  } catch (error) {
    return errorResponse(error);
  }
}
