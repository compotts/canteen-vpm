import { del, put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { dishes, translations } from "@/server/db/schema";
import { requireAdmin } from "@/server/auth";
import { HttpError, errorResponse, json, noContent, parse } from "@/server/http";
import { photoTargetSchema } from "@/lib/validators";

type PhotoTable = "dishes" | "translations";

const blobToken = (): string | undefined => process.env.BLOB_READ_WRITE_TOKEN;

async function readPhotoUrl(
  table: PhotoTable,
  id: string
): Promise<{ photoUrl: string | null } | null> {
  const [row] =
    table === "dishes"
      ? await db
          .select({ photoUrl: dishes.photoUrl })
          .from(dishes)
          .where(eq(dishes.id, id))
      : await db
          .select({ photoUrl: translations.photoUrl })
          .from(translations)
          .where(eq(translations.id, Number(id)));

  return row ?? null;
}

async function writePhotoUrl(
  table: PhotoTable,
  id: string,
  photoUrl: string | null
): Promise<void> {
  if (table === "dishes") {
    await db
      .update(dishes)
      .set({ photoUrl, updatedAt: new Date() })
      .where(eq(dishes.id, id));
    return;
  }
  await db
    .update(translations)
    .set({ photoUrl, updatedAt: new Date() })
    .where(eq(translations.id, Number(id)));
}

async function deleteBlobSafe(url: string | null): Promise<void> {
  if (!url) return;
  try {
    await del(url, { token: blobToken() });
  } catch {
    return;
  }
}

async function resolveTarget(request: Request) {
  requireAdmin(request);

  const params = new URL(request.url).searchParams;
  const { table, id } = parse(photoTargetSchema, {
    table: params.get("table"),
    id: params.get("id"),
  });

  if (table === "translations" && !Number.isInteger(Number(id))) {
    throw new HttpError(400, "id is required");
  }

  const row = await readPhotoUrl(table, id);
  if (!row) throw new HttpError(404, "not found");

  return { table, id, current: row.photoUrl };
}

export async function POST(request: Request): Promise<Response> {
  try {
    const { table, id, current } = await resolveTarget(request);

    const body = await request.arrayBuffer();
    if (body.byteLength === 0) throw new HttpError(400, "empty body");

    const blob = await put(`${table}/${id}.jpg`, body, {
      access: "public",
      contentType: "image/jpeg",
      addRandomSuffix: true,
      token: blobToken(),
    });

    await writePhotoUrl(table, id, blob.url);
    await deleteBlobSafe(current);

    return json({ id, photoUrl: blob.url });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    const { table, id, current } = await resolveTarget(request);

    await writePhotoUrl(table, id, null);
    await deleteBlobSafe(current);

    return noContent();
  } catch (error) {
    return errorResponse(error);
  }
}
