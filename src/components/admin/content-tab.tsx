"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Save } from "lucide-react";
import { locales } from "@/i18n/config";
import { loadSiteContent, saveSiteContent } from "@/lib/api/site-content";
import { SITE_CONTENT_KEYS, type SiteContentKey } from "@/lib/site-content";
import type { UpdateText } from "@/types/api";
import { ErrorBanner } from "./error-banner";

const emptyText = (): UpdateText => ({ lt: "", ru: "", en: "" });

export function ContentTab() {
  const t = useTranslations();
  const [section, setSection] = useState<SiteContentKey>("about");
  const [texts, setTexts] = useState<Record<SiteContentKey, UpdateText>>({
    about: emptyText(),
    eco: emptyText(),
  });
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [retry, setRetry] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    loadSiteContent(controller.signal)
      .then((entries) => {
        if (controller.signal.aborted) return;
        setReady(true);
        setTexts({
          about: entries.find((entry) => entry.key === "about")?.text ?? emptyText(),
          eco: entries.find((entry) => entry.key === "eco")?.text ?? emptyText(),
        });
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(t("admin.loadError"));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [t, retry]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ready || saving) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const entry = await saveSiteContent(section, texts[section]);
      setTexts((previous) => ({ ...previous, [entry.key]: entry.text }));
      setSaved(true);
    } catch {
      setError(t("admin.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ErrorBanner message={error} />
      {error && !ready && (
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            setLoading(true);
            setError(null);
            setRetry((value) => value + 1);
          }}
          className="mb-4 min-h-11 rounded-full bg-[var(--border-subtle)] px-4 text-sm"
        >
          {t("errors.retry")}
        </button>
      )}
      <form onSubmit={submit} className="surface rounded-[var(--radius-lg)] p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          {SITE_CONTENT_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              disabled={saving}
              aria-pressed={section === key}
              onClick={() => {
                setSection(key);
                setSaved(false);
              }}
              className={`min-h-11 rounded-full px-4 text-sm font-medium ${section === key ? "bg-[var(--accent)] text-[var(--btn-primary-color)]" : "bg-[var(--border-subtle)] text-[var(--text-muted)]"}`}
            >
              {t(key === "about" ? "design.about" : "design.ecoTitle")}
            </button>
          ))}
        </div>
        <p className="m-0 text-sm leading-relaxed text-[var(--text-muted)]">
          {t("admin.content.hint")}
        </p>
        {locales.map((locale) => (
          <div key={locale} className="block space-y-2">
            <label
              htmlFor={`site-content-${section}-${locale}`}
              className="block text-xs font-semibold uppercase text-[var(--text-muted)]"
            >
              {locale.toUpperCase()}
            </label>
            <textarea
              id={`site-content-${section}-${locale}`}
              value={texts[section][locale]}
              disabled={!ready || saving}
              maxLength={8000}
              onChange={(event) => {
                setTexts((previous) => ({
                  ...previous,
                  [section]: { ...previous[section], [locale]: event.target.value },
                }));
                setSaved(false);
              }}
              className="min-h-32 w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-base text-[var(--text)] disabled:opacity-50"
            />
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={!ready || saving}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 text-sm font-medium text-[var(--btn-primary-color)] disabled:opacity-50"
          >
            <Save size={16} aria-hidden="true" />
            {t(loading ? "common.loading" : saving ? "admin.saving" : "admin.saveChanges")}
          </button>
          {saved && (
            <p role="status" className="m-0 text-sm text-[var(--text-muted)]">
              {t("admin.content.saved")}
            </p>
          )}
        </div>
      </form>
    </>
  );
}
