"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Globe, Trash2, User } from "lucide-react";
import { deleteFeedback, loadFeedback } from "@/lib/api/feedback";
import { localeTags, type Locale } from "@/i18n/config";
import { ErrorBanner } from "./error-banner";
import type { FeedbackEntry } from "@/types/api";

export function FeedbackTab() {
  const t = useTranslations();
  const locale = useLocale() as Locale;

  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFeedback()
      .then(setEntries)
      .catch((err: Error) => setError(err.message || t("admin.loadError")))
      .finally(() => setLoading(false));
  }, [t]);

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("admin.feedback.deleteConfirm"))) return;
    setError(null);

    try {
      await deleteFeedback(id);
      setEntries((previous) => previous.filter((entry) => entry.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.saveError"));
    }
  };

  const formatDate = (value: string): string => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString(localeTags[locale]);
  };

  return (
    <>
      <ErrorBanner message={error} />

      <div className="space-y-3">
        {loading ? (
          <p className="text-[var(--text-muted)] text-sm py-4">
            {t("admin.feedback.loading")}
          </p>
        ) : entries.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm py-4">
            {t("admin.feedback.empty")}
          </p>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="surface rounded-[var(--radius-md)] p-3"
            >
              <div className="flex justify-between gap-3 items-start">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2 text-xs text-[var(--text-muted)]">
                  <span className="inline-flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {entry.username || t("admin.feedback.anonymous")}
                  </span>
                  {entry.ip && (
                    <span className="inline-flex items-center gap-1 font-mono">
                      <Globe className="w-3.5 h-3.5" />
                      {entry.ip}
                    </span>
                  )}
                  <span>{formatDate(entry.createdAt)}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(entry.id)}
                  className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg flex-shrink-0"
                  aria-label={t("admin.delete")}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p className="m-0 text-sm text-[var(--text)] whitespace-pre-wrap break-words">
                {entry.message}
              </p>

              {entry.userAgent && (
                <p className="mt-2 mb-0 text-[10px] text-[var(--text-muted)] break-words opacity-70">
                  {entry.userAgent}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}
