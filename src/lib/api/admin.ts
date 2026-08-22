import { apiFetch } from "./client";
import type { AdminAccount, AdminPermission, AdminSessionInfo } from "@/types/api";

export function getAdminSession(): Promise<AdminSessionInfo> {
  return apiFetch<AdminSessionInfo>("/api/admin/session");
}

export function openAdminSession(password: string): Promise<AdminSessionInfo> {
  return apiFetch<AdminSessionInfo>("/api/admin/session", {
    method: "POST",
    body: { password },
  });
}

export function closeAdminSession(): Promise<null> {
  return apiFetch<null>("/api/admin/session", { method: "DELETE" });
}

export type AdminMutationResult = {
  admin: AdminAccount;
  password: string | null;
};

export function loadAdmins(): Promise<AdminAccount[]> {
  return apiFetch<AdminAccount[]>("/api/admin/accounts");
}

export function createAdmin(input: {
  username: string;
  permissions: AdminPermission[];
  password?: string;
}): Promise<AdminMutationResult> {
  return apiFetch<AdminMutationResult>("/api/admin/accounts", {
    method: "POST",
    body: input,
  });
}

export function updateAdmin(input: {
  username: string;
  permissions?: AdminPermission[];
  password?: string;
  regeneratePassword?: boolean;
}): Promise<AdminMutationResult> {
  return apiFetch<AdminMutationResult>("/api/admin/accounts", {
    method: "PATCH",
    body: input,
  });
}

export function deleteAdmin(username: string): Promise<null> {
  return apiFetch<null>(
    `/api/admin/accounts?username=${encodeURIComponent(username)}`,
    { method: "DELETE" }
  );
}
