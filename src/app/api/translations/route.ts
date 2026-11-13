import { auditMutation } from "@/server/activity";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { translations } from "@/server/db/schema";
import {
  formatTranslation,
  getTranslations,
} from "@/server/queries/translations";
import { requireAdmin } from "@/server/auth";
import {
  HttpError,
  errorResponse,
  json,
  noContent,
  parse,
  readJson,
} from "@/server/http";
import {
  translationCreateSchema,
  translationUpdateSchema,
} from "@/lib/validators";

export async function GET(): Promise<Response> {
  try {
    return json(await getTranslations());
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await readJson(request);
    const { username } = await requireAdmin(request, "translations");

    const input = parse(translationCreateSchema, body);
    const [row] = await auditMutation(
      db
        .insert(translations)
        .values({
          nameLt: input.name,
          nameRu: input.nameRu,
          nameEn: input.nameEn,
        })
        .returning(),
      {
        username,
        category: "admin",
        action: "translation_create",
        target: input.name,
        details: input,
      }
    );

    return json(formatTranslation(row), 201);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    const body = await readJson(request);
    const { username } = await requireAdmin(request, "translations");

    const input = parse(translationUpdateSchema, body);
    const [row] = await auditMutation(
      db
        .update(translations)
        .set({
          ...(input.name !== null && { nameLt: input.name }),
          ...(input.nameRu !== null && { nameRu: input.nameRu }),
          ...(input.nameEn !== null && { nameEn: input.nameEn }),
          updatedAt: new Date(),
        })
        .where(eq(translations.id, input.id))
        .returning(),
      {
        username,
        category: "admin",
        action: "translation_update",
        target: String(input.id),
        details: input,
      }
    );

    if (!row) throw new HttpError(404, "not found");
    return json(formatTranslation(row));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    const { username } = await requireAdmin(request, "translations");

    const raw = new URL(request.url).searchParams.get("id");
    const id = Number(raw);
    if (!raw || !Number.isInteger(id)) throw new HttpError(400, "id is required");

    await auditMutation(
      db.delete(translations).where(eq(translations.id, id)),
      {
        username,
        category: "admin",
        action: "translation_delete",
        target: String(id),
        details: {

        },
      }
    );
    return noContent();
  } catch (error) {
    return errorResponse(error);
  }
}
