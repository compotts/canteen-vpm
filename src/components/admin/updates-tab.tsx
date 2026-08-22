"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import {
  createUpdate,
  deleteUpdate,
  loadUpdates,
  updateUpdate,
} from "@/lib/api/updates";
import { pickTextByLang } from "@/lib/text";
import { locales, type Locale } from "@/i18n/config";
import { useLiquidGlass } from "@/hooks/use-liquid-glass";
import { ErrorBanner } from "./error-banner";
import type { AppUpdate, UpdateText } from "@/types/api";

const EMPTY_TEXT: UpdateText = { lt: "", ru: "", en: "" };

const inputClass =
  "rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)]";

export function UpdatesTab() {
  const t = useTranslations();
  const locale = useLocale();

  const [updates, setUpdates] = useState<AppUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<Locale>("lt");
  const [version, setVersion] = useState("");
  const [dateLabel, setDateLabel] = useState("");
  const [emoji, setEmoji] = useState("");
  const [text, setText] = useState<UpdateText>(EMPTY_TEXT);
  const langsRef = useLiquidGlass<HTMLDivElement>();

  useEffect(() => {
    loadUpdates()
      .then(setUpdates)
      .catch((err: Error) => setError(err.message || t("admin.loadError")))
      .finally(() => setLoading(false));
  }, [t]);

  const resetForm = () => {
    setVersion("");
    setDateLabel("");
    setEmoji("");
    setText(EMPTY_TEXT);
    setEditingId(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!Object.values(text).some((value) => value.trim())) {
        throw new Error(t("admin.atLeastOneLanguageRequired"));
      }

      const payload = {
        ...(editingId ? { id: editingId } : {}),
        version: version || null,
        dateLabel: dateLabel || null,
        emoji: emoji || null,
        text,
      };

      if (editingId) {
        const updated = await updateUpdate(payload);
        setUpdates((previous) =>
          previous.map((item) => (item.id === updated.id ? updated : item))
        );
      } else {
        const created = await createUpdate(payload);
        setUpdates((previous) => [created, ...previous]);
      }

      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("admin.deleteConfirm"))) return;

    try {
      await deleteUpdate(id);
      setUpdates((previous) => previous.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.saveError"));
    }
  };

  const startEdit = (update: AppUpdate) => {
    setEditingId(update.id);
    setVersion(update.version ?? "");
    setDateLabel(update.dateLabel ?? "");
    setEmoji(update.emoji ?? "");
    setText({
      lt: update.text.lt || "",
      ru: update.text.ru || "",
      en: update.text.en || "",
    });
    setActiveLang("lt");
  };

  return (
    <>
      <ErrorBanner message={error} />

      <form
        onSubmit={handleSubmit}
        className="glass-card rounded-[var(--radius-lg)] p-4 mb-6 space-y-3"
      >
        <div
          ref={langsRef}
          className="inline-flex items-center gap-1 glass rounded-full p-1 mb-1"
        >
          {locales.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setActiveLang(code)}
              className={`px-3 py-1.5 text-xs md:text-sm rounded-full font-medium ${
                activeLang === code
                  ? "bg-[var(--accent)] text-[var(--btn-primary-color)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--glass-highlight)]"
              }`}
            >
              {code.toUpperCase()}
              {text[code].trim() && (
                <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
              )}
            </button>
          ))}
        </div>

        <textarea
          placeholder={t("admin.textPlaceholder")}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)] min-h-[80px]"
          value={text[activeLang]}
          onChange={(event) =>
            setText((previous) => ({
              ...previous,
              [activeLang]: event.target.value,
            }))
          }
        />

        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder={t("admin.versionPlaceholder")}
            className={`flex-1 min-w-[140px] ${inputClass}`}
            value={version}
            onChange={(event) => setVersion(event.target.value)}
          />
          <input
            type="date"
            className={`flex-1 min-w-[180px] ${inputClass}`}
            value={dateLabel}
            onChange={(event) => setDateLabel(event.target.value)}
          />
          <input
            type="text"
            placeholder={t("admin.emojiPlaceholder")}
            className={`w-20 ${inputClass}`}
            value={emoji}
            onChange={(event) => setEmoji(event.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
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
              ? t("admin.saving")
              : editingId
                ? t("admin.saveChanges")
                : t("admin.addUpdate")}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--border-subtle)] text-[var(--text)] hover:bg-[var(--border)] transition-colors"
            >
              <X className="w-4 h-4" /> {t("admin.cancel")}
            </button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        {loading ? (
          <p className="text-[var(--text-muted)] text-sm">
            {t("admin.loadingUpdates")}
          </p>
        ) : updates.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm">
            {t("admin.emptyUpdates")}
          </p>
        ) : (
          updates.map((update) => (
            <div
              key={update.id}
              className="glass-card rounded-[var(--radius-md)] p-3 flex justify-between gap-3 items-start"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {update.dateLabel && (
                    <span className="text-xs text-[var(--text-muted)]">
                      {update.dateLabel}
                    </span>
                  )}
                  {update.version && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--border-subtle)] text-[var(--text-muted)]">
                      {update.version}
                    </span>
                  )}
                </div>
                <p className="m-0 text-sm text-[var(--text)] whitespace-pre-wrap">
                  {update.emoji || ""} {pickTextByLang(update.text, locale)}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => startEdit(update)}
                  className="p-1.5 text-[var(--text-muted)] hover:bg-[var(--glass-highlight)] hover:text-[var(--text)] rounded-lg"
                  aria-label={t("admin.edit")}
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(update.id)}
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
