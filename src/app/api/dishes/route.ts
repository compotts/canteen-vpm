import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { dishes } from "@/server/db/schema";
import { formatDish, getDishes } from "@/server/queries/dishes";
import { requireAdmin } from "@/server/auth";
import {
  HttpError,
  errorResponse,
  json,
  noContent,
  parse,
  readJson,
} from "@/server/http";
import { dishCreateSchema, dishUpdateSchema } from "@/lib/validators";

function toNumericColumn(value: number | null): string | null {
  return value === null ? null : String(value);
}

export async function GET(): Promise<Response> {
  try {
    return json(await getDishes());
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await readJson(request);
    requireAdmin(request, body);

    const input = parse(dishCreateSchema, body);
    const [row] = await db
      .insert(dishes)
      .values({
        id: input.id,
        category: input.category,
        nameLt: input.name,
        nameRu: input.nameRu,
        nameEn: input.nameEn,
        weight: input.weight,
        priceStudent: toNumericColumn(input.priceStudent),
        priceTeacher: toNumericColumn(input.priceTeacher),
      })
      .returning();

    return json(formatDish(row), 201);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    const body = await readJson(request);
    requireAdmin(request, body);

    const input = parse(dishUpdateSchema, body);
    const [row] = await db
      .update(dishes)
      .set({
        ...(input.category !== null && { category: input.category }),
        ...(input.name !== null && { nameLt: input.name }),
        ...(input.nameRu !== null && { nameRu: input.nameRu }),
        ...(input.nameEn !== null && { nameEn: input.nameEn }),
        ...(input.weight !== null && { weight: input.weight }),
        ...(input.priceStudent !== null && {
          priceStudent: toNumericColumn(input.priceStudent),
        }),
        ...(input.priceTeacher !== null && {
          priceTeacher: toNumericColumn(input.priceTeacher),
        }),
        updatedAt: new Date(),
      })
      .where(eq(dishes.id, input.id))
      .returning();

    if (!row) throw new HttpError(404, "not found");
    return json(formatDish(row));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    requireAdmin(request);

    const id = new URL(request.url).searchParams.get("id");
    if (!id) throw new HttpError(400, "id is required");

    await db.delete(dishes).where(eq(dishes.id, id));
    return noContent();
  } catch (error) {
    return errorResponse(error);
  }
}
