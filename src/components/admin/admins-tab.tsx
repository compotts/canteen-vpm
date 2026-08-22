"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, KeyRound, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import {
  createAdmin,
  deleteAdmin,
  loadAdmins,
  updateAdmin,
} from "@/lib/api/admin";
import { ADMIN_PERMISSIONS, type AdminPermission } from "@/lib/permissions";
import { ErrorBanner } from "./error-banner";
import type { AdminAccount } from "@/types/api";

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)]";

const labelClass =
  "block text-[10px] font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider";

function PasswordNotice({ password }: { password: string }) {
  const t = useTranslations();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--hover)] px-3 py-2.5 mb-4">
      <p className="m-0 mb-2 text-xs text-[var(--text-muted)] leading-relaxed">
        {t("admin.admins.newPassword")}
      </p>
      <div className="flex items-center gap-2">
        <code className="flex-1 min-w-0 break-all text-sm font-mono text-[var(--text)]">
          {password}
        </code>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--accent)] text-[var(--btn-primary-color)] border-0 cursor-pointer shrink-0"
        >
          <Copy className="w-3.5 h-3.5" />
          {copied ? t("admin.admins.copied") : t("admin.admins.copy")}
        </button>
      </div>
    </div>
  );
}

export function AdminsTab() {
  const t = useTranslations();

  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issuedPassword, setIssuedPassword] = useState<string | null>(null);

  const [editing, setEditing] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);

  useEffect(() => {
    loadAdmins()
      .then(setAccounts)
      .catch((err: Error) => setError(err.message || t("admin.loadError")))
      .finally(() => setLoading(false));
  }, [t]);

  const resetForm = () => {
    setEditing(null);
    setUsername("");
    setPassword("");
    setPermissions([]);
  };

  const togglePermission = (permission: AdminPermission) => {
    setPermissions((previous) =>
      previous.includes(permission)
        ? previous.filter((value) => value !== permission)
        : [...previous, permission]
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setIssuedPassword(null);

    try {
      if (editing) {
        const result = await updateAdmin({
          username: editing,
          permissions,
          ...(password ? { password } : {}),
        });
        setAccounts((previous) =>
          previous.map((item) =>
            item.username === result.admin.username ? result.admin : item
          )
        );
        if (result.password) setIssuedPassword(result.password);
      } else {
        const result = await createAdmin({
          username,
          permissions,
          ...(password ? { password } : {}),
        });
        setAccounts((previous) =>
          [...previous, result.admin].sort((a, b) =>
            a.username.localeCompare(b.username)
          )
        );
        if (result.password) setIssuedPassword(result.password);
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegenerate = async (account: AdminAccount) => {
    setError(null);
    setIssuedPassword(null);

    try {
      const result = await updateAdmin({
        username: account.username,
        regeneratePassword: true,
      });
      if (result.password) setIssuedPassword(result.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.saveError"));
    }
  };

  const handleDelete = async (account: AdminAccount) => {
    if (!window.confirm(t("admin.admins.deleteConfirm"))) return;

    try {
      await deleteAdmin(account.username);
      setAccounts((previous) =>
        previous.filter((item) => item.username !== account.username)
      );
      if (editing === account.username) resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.saveError"));
    }
  };

  const startEdit = (account: AdminAccount) => {
    setEditing(account.username);
    setUsername(account.username);
    setPassword("");
    setPermissions(account.permissions);
    setIssuedPassword(null);
  };

  return (
    <>
      <ErrorBanner message={error} />
      {issuedPassword && <PasswordNotice password={issuedPassword} />}

      <form
        onSubmit={handleSubmit}
        className="surface rounded-[var(--radius-lg)] p-4 mb-6 space-y-3"
      >
        <div>
          <label className={labelClass}>{t("admin.admins.username")}</label>
          <input
            type="text"
            className={inputClass}
            value={username}
            disabled={editing !== null}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
          <p className="m-0 mt-1 text-xs text-[var(--text-muted)]">
            {t("admin.admins.usernameHint")}
          </p>
        </div>

        <div>
          <label className={labelClass}>{t("admin.admins.permissions")}</label>
          <div className="flex flex-wrap gap-2">
            {ADMIN_PERMISSIONS.map((permission) => (
              <button
                key={permission}
                type="button"
                onClick={() => togglePermission(permission)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  permissions.includes(permission)
                    ? "bg-[var(--accent)] text-[var(--btn-primary-color)]"
                    : "bg-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                {t(`admin.permissions.${permission}`)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>{t("admin.admins.password")}</label>
          <input
            type="text"
            className={inputClass}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <p className="m-0 mt-1 text-xs text-[var(--text-muted)]">
            {t("admin.admins.passwordHint")}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-[var(--accent)] text-[var(--btn-primary-color)] text-sm font-medium flex-1 disabled:opacity-50 border-0 cursor-pointer"
          >
            {editing ? (
              <Save className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {submitting
              ? t("admin.admins.saving")
              : editing
                ? t("admin.admins.save")
                : t("admin.admins.add")}
          </button>

          {editing && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--border-subtle)] text-[var(--text)] border-0 cursor-pointer"
            >
              <X className="w-4 h-4" /> {t("admin.admins.cancel")}
            </button>
          )}
        </div>
      </form>

      <div className="stagger space-y-2">
        {loading ? (
          <p className="text-[var(--text-muted)] text-sm py-4">
            {t("admin.admins.loading")}
          </p>
        ) : accounts.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm py-4">
            {t("admin.admins.empty")}
          </p>
        ) : (
          accounts.map((account) => (
            <div
              key={account.username}
              className="surface rounded-[var(--radius-md)] p-3 flex justify-between gap-3 items-start"
            >
              <div className="flex-1 min-w-0">
                <p className="m-0 text-sm font-medium text-[var(--text)] font-mono">
                  {account.username}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {account.permissions.length === 0 ? (
                    <span className="text-xs text-[var(--text-muted)]">
                      {t("admin.admins.none")}
                    </span>
                  ) : (
                    account.permissions.map((permission) => (
                      <span
                        key={permission}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--border-subtle)] text-[var(--text-muted)]"
                      >
                        {t(`admin.permissions.${permission}`)}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleRegenerate(account)}
                  className="p-1.5 text-[var(--text-muted)] hover:bg-[var(--hover)] hover:text-[var(--text)] rounded-lg"
                  aria-label={t("admin.admins.generate")}
                  title={t("admin.admins.generate")}
                >
                  <KeyRound className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(account)}
                  className="p-1.5 text-[var(--text-muted)] hover:bg-[var(--hover)] hover:text-[var(--text)] rounded-lg"
                  aria-label={t("admin.admins.edit")}
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(account)}
                  className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg"
                  aria-label={t("admin.admins.delete")}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
