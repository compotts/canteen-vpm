import { asc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { admins } from "@/server/db/schema";
import { ADMIN_PERMISSIONS, type AdminPermission } from "@/lib/permissions";
import type { AdminAccount } from "@/types/api";

type AdminRow = typeof admins.$inferSelect;

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function ownerUsername(): string {
  return normalizeUsername(process.env.OWNER_USERNAME ?? "");
}

export function isOwner(username: string): boolean {
  const owner = ownerUsername();
  return owner.length > 0 && normalizeUsername(username) === owner;
}

export function sanitizePermissions(input: unknown): AdminPermission[] {
  if (!Array.isArray(input)) return [];
  return ADMIN_PERMISSIONS.filter((permission) => input.includes(permission));
}

export function formatAdmin(row: AdminRow): AdminAccount {
  return {
    username: row.username,
    permissions: sanitizePermissions(row.permissions),
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getAdmins(): Promise<AdminAccount[]> {
  const rows = await db.select().from(admins).orderBy(asc(admins.username));
  return rows.map(formatAdmin);
}

export async function findAdmin(username: string): Promise<AdminRow | null> {
  const [row] = await db
    .select()
    .from(admins)
    .where(eq(admins.username, normalizeUsername(username)))
    .limit(1);
  return row ?? null;
}

export async function getPermissions(
  username: string
): Promise<AdminPermission[] | null> {
  if (isOwner(username)) return [...ADMIN_PERMISSIONS];

  const row = await findAdmin(username);
  return row ? sanitizePermissions(row.permissions) : null;
}
