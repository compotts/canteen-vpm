import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { admins } from "@/server/db/schema";
import { requireOwner } from "@/server/auth";
import {
  findAdmin,
  formatAdmin,
  getAdmins,
  isOwner,
  normalizeUsername,
} from "@/server/queries/admins";
import { generatePassword, hashPassword } from "@/server/password";
import {
  HttpError,
  errorResponse,
  json,
  noContent,
  parse,
  readJson,
} from "@/server/http";
import { adminCreateSchema, adminUpdateSchema } from "@/lib/validators";

export async function GET(request: Request): Promise<Response> {
  try {
    await requireOwner(request);
    return json(await getAdmins());
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const owner = await requireOwner(request);
    const input = parse(adminCreateSchema, await readJson(request));

    if (isOwner(input.username)) {
      throw new HttpError(400, "the owner account is managed by environment");
    }
    if (await findAdmin(input.username)) {
      throw new HttpError(409, "this administrator already exists");
    }

    const password = input.password ?? generatePassword();
    const [row] = await db
      .insert(admins)
      .values({
        username: input.username,
        passwordHash: hashPassword(password),
        permissions: input.permissions,
        createdBy: owner.username,
      })
      .returning();

    return json({ admin: formatAdmin(row), password }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    await requireOwner(request);
    const input = parse(adminUpdateSchema, await readJson(request));

    if (isOwner(input.username)) {
      throw new HttpError(400, "the owner account is managed by environment");
    }

    const existing = await findAdmin(input.username);
    if (!existing) throw new HttpError(404, "not found");

    const password = input.regeneratePassword
      ? generatePassword()
      : (input.password ?? null);

    const [row] = await db
      .update(admins)
      .set({
        ...(input.permissions && { permissions: input.permissions }),
        ...(password && { passwordHash: hashPassword(password) }),
        updatedAt: new Date(),
      })
      .where(eq(admins.username, normalizeUsername(input.username)))
      .returning();

    return json({ admin: formatAdmin(row), password });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    await requireOwner(request);

    const raw = new URL(request.url).searchParams.get("username");
    if (!raw) throw new HttpError(400, "username is required");

    const username = normalizeUsername(raw);
    if (isOwner(username)) {
      throw new HttpError(400, "the owner account is managed by environment");
    }

    await db.delete(admins).where(eq(admins.username, username));
    return noContent();
  } catch (error) {
    return errorResponse(error);
  }
}
