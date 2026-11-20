import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { favoriteKey } from "@/lib/favorites";
import { requireIdentity } from "@/server/auth";
import { db } from "@/server/db";
import { userFavorites } from "@/server/db/schema";
import { errorResponse, json, parse, readJson } from "@/server/http";

const favoriteSchema = z.object({
  name: z.string().trim().min(1).max(500)
    .transform(favoriteKey)
    .pipe(z.string().min(1).max(500)),
  isFavorite: z.boolean(),
});

function privateJson(data: unknown): Response {
  const response = json(data);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function GET(request: Request): Promise<Response> {
  try {
    const username = await requireIdentity(request);
    const rows = await db.select({ key: userFavorites.dishKey })
      .from(userFavorites)
      .where(eq(userFavorites.username, username))
      .orderBy(desc(userFavorites.createdAt), asc(userFavorites.dishKey));
    return privateJson({ keys: rows.map((row) => row.key) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request): Promise<Response> {
  try {
    const username = await requireIdentity(request);
    const { name: key, isFavorite } = parse(favoriteSchema, await readJson(request));
    if (isFavorite) {
      await db.insert(userFavorites).values({ username, dishKey: key })
        .onConflictDoNothing({ target: [userFavorites.username, userFavorites.dishKey] });
    } else {
      await db.delete(userFavorites).where(and(
        eq(userFavorites.username, username),
        eq(userFavorites.dishKey, key)
      ));
    }
    return privateJson({ key, isFavorite });
  } catch (error) {
    return errorResponse(error);
  }
}
