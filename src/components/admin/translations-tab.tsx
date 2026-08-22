"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import {
  createTranslation,
  deleteTranslation,
  loadTranslations,
  updateTranslation,
} from "@/lib/api/translations";
import { ErrorBanner } from "./error-banner";
import type { Translation } from "@/types/api";

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)]";

const labelClass =
  "block text-[10px] font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider";

export function localizedName(
  entry: { name: string; nameRu: string | null; nameEn: string | null },
  locale: string
): string {
  if (locale === "ru") return entry.nameRu || entry.name;
  if (locale === "en") return entry.nameEn || entry.name;
  return entry.name;
}

export function TranslationsTab() {
  const t = useTranslations();
  const locale = useLocale();

  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [nameRu, setNameRu] = useState("");
  const [nameEn, setNameEn] = useState("");

  useEffect(() => {
    loadTranslations()
      .then(setTranslations)
      .catch((err: Error) => setError(err.message || t("admin.loadError")))
      .finally(() => setLoading(false));
  }, [t]);

  const resetForm = () => {
    setName("");
    setNameRu("");
    setNameEn("");
    setEditingId(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...(editingId ? { id: editingId } : {}),
        name,
        nameRu: nameRu || null,
        nameEn: nameEn || null,
      };

      if (editingId) {
        const updated = await updateTranslation(payload);
        setTranslations((previous) =>
          previous.map((item) => (item.id === updated.id ? updated : item))
        );
      } else {
        const created = await createTranslation(payload);
        setTranslations((previous) => [...previous, created]);
      }

      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t("admin.dishes.deleteConfirm"))) return;

    try {
      await deleteTranslation(id);
      setTranslations((previous) => previous.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.saveError"));
    }
  };

  const startEdit = (entry: Translation) => {
    setEditingId(entry.id);
    setName(entry.name);
    setNameRu(entry.nameRu ?? "");
    setNameEn(entry.nameEn ?? "");
  };

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return translations;

    return translations.filter(
      (entry) =>
        entry.name.toLowerCase().includes(query) ||
        entry.nameRu?.toLowerCase().includes(query) ||
        entry.nameEn?.toLowerCase().includes(query)
    );
  }, [translations, search]);

  return (
    <>
      <ErrorBanner message={error} />

      <form
        onSubmit={handleSubmit}
        className="glass-card rounded-[var(--radius-lg)] p-4 mb-6 space-y-3"
      >
        <div className="space-y-3">
          <div>
            <label className={labelClass}>{t("catalog.filters.name")}</label>
            <input
              type="text"
              placeholder="Agurkinė sriuba"
              className={inputClass}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>
                {t("catalog.filters.name")} (RU)
              </label>
              <input
                type="text"
                placeholder="Огуречный суп"
                className={inputClass}
                value={nameRu}
                onChange={(event) => setNameRu(event.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>
                {t("catalog.filters.name")} (EN)
              </label>
              <input
                type="text"
                placeholder="Cucumber soup"
                className={inputClass}
                value={nameEn}
                onChange={(event) => setNameEn(event.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-[var(--accent)] text-[var(--btn-primary-color)] text-sm font-medium flex-1 disabled:opacity-50"
          >
            {editingId ? (
              <Save className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {submitting
              ? t("admin.dishes.saving")
              : editingId
                ? t("admin.dishes.save")
                : t("admin.dishes.add")}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--border-subtle)] text-[var(--text)] hover:bg-[var(--border)] transition-colors"
            >
              <X className="w-4 h-4" /> {t("admin.dishes.cancel")}
            </button>
          )}
        </div>
      </form>

      <div className="mb-4">
        <input
          type="text"
          className={inputClass}
          placeholder={t("admin.dishes.searchPlaceholder")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        {loading ? (
          <p className="text-[var(--text-muted)] text-sm py-4">
            {t("admin.dishes.loading")}
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm py-4">
            {t("admin.dishes.noResults")}
          </p>
        ) : (
          filtered.map((entry) => (
            <div
              key={entry.id}
              className="glass-card rounded-[var(--radius-md)] p-3 flex justify-between gap-3 items-start"
            >
              <div className="flex-1 min-w-0">
                <p className="m-0 text-sm font-medium text-[var(--text)]">
                  {localizedName(entry, locale)}
                </p>
                <div className="mt-1 space-y-0.5 text-xs text-[var(--text-muted)]">
                  {entry.nameRu && <p className="m-0">{entry.nameRu}</p>}
                  {entry.nameEn && <p className="m-0">{entry.nameEn}</p>}
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => startEdit(entry)}
                  className="p-1.5 text-[var(--text-muted)] hover:bg-[var(--glass-highlight)] hover:text-[var(--text)] rounded-lg"
                  aria-label={t("admin.edit")}
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(entry.id)}
                  className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg"
                  aria-label={t("admin.delete")}
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
