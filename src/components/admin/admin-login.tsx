"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ShieldCheck } from "lucide-react";
import { openAdminSession } from "@/lib/api/admin";
import { getStoredUsername } from "@/lib/user-storage";
import { useAdminSession } from "@/components/admin-session-provider";
import { ErrorBanner } from "./error-banner";

export function AdminLogin() {
  const t = useTranslations();
  const { refresh } = useAdminSession();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUsername(getStoredUsername());
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await openAdminSession(password);
      setPassword("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.auth.error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto w-full">
      <div className="surface rounded-[var(--radius-lg)] p-5 animate-rise">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck
            className="w-5 h-5 text-[var(--text-muted)]"
            aria-hidden="true"
          />
          <h1 className="text-lg font-semibold text-[var(--text)] m-0">
            {t("admin.auth.title")}
          </h1>
        </div>

        <p className="text-sm text-[var(--text-muted)] leading-relaxed m-0 mb-4">
          {t("admin.auth.hint", { username: username || "?" })}
        </p>

        <ErrorBanner message={error} />

        <form onSubmit={handleSubmit}>
          <label
            htmlFor="admin-password"
            className="block text-sm font-medium mb-1.5 text-[var(--text)]"
          >
            {t("admin.auth.password")}
          </label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5 text-sm text-[var(--text)] mb-4"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <button
            type="submit"
            disabled={submitting || password.length === 0}
            className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-full bg-[var(--accent)] text-[var(--btn-primary-color)] text-sm font-medium border-0 cursor-pointer disabled:opacity-50"
          >
            {submitting ? t("admin.auth.submitting") : t("admin.auth.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
