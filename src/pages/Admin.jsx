import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Clock, Plus, Trash2, Pencil, X, Save } from "lucide-react";
import { createUpdate, deleteUpdate, loadUpdates, updateUpdate } from "../services/updates.js";
import { isStoredUserAdmin } from "../services/userStorage.js";

function pickTextByLang(map, lang) {
  if (!map || typeof map !== "object") return "";
  const order = [lang, "lt", "ru", "en"];
  for (const key of order) {
    const value = map[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return "";
}

export default function Admin() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [activeLang, setActiveLang] = useState("lt");
  const [version, setVersion] = useState("");
  const [dateLabel, setDateLabel] = useState("");
  const [emoji, setEmoji] = useState("");
  const [text, setText] = useState({ lt: "", ru: "", en: "" });

  const isAdmin = isStoredUserAdmin();

  const appLang = i18n.language || "lt";

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return undefined;
    }

    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const list = await loadUpdates();
        if (!ignore) setUpdates(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!ignore) setError(e.message || t("admin.loadError"));
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [isAdmin, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...(editingId ? { id: editingId } : {}),
        version: version || null,
        dateLabel: dateLabel || null,
        emoji: emoji || null,
        text,
      };

      const hasAtLeastOneText = Object.values(text).some(
        (value) => typeof value === "string" && value.trim().length > 0
      );
      if (!hasAtLeastOneText) {
        throw new Error(t("admin.atLeastOneLanguageRequired"));
      }

      if (editingId) {
        const updated = await updateUpdate(payload);
        setUpdates((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      } else {
        const created = await createUpdate(payload);
        setUpdates((prev) => [created, ...prev]);
      }
      setVersion("");
      setDateLabel("");
      setEmoji("");
      setText({ lt: "", ru: "", en: "" });
      setEditingId(null);
    } catch (e) {
      setError(e.message || t("admin.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t("admin.deleteConfirm"))) return;
    await deleteUpdate(id);
    setUpdates((prev) => prev.filter((u) => u.id !== id));
  };

  const startEdit = (u) => {
    setError(null);
    setEditingId(u.id);
    setVersion(u.version || "");
    setDateLabel(u.dateLabel || "");
    setEmoji(u.emoji || "");
    setText({
      lt: u.text?.lt || "",
      ru: u.text?.ru || "",
      en: u.text?.en || "",
    });
    setActiveLang("lt");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setError(null);
    setVersion("");
    setDateLabel("");
    setEmoji("");
    setText({ lt: "", ru: "", en: "" });
  };

  const handleTextChange = (e) => {
    const value = e.target.value;
    setText((prev) => ({
      ...prev,
      [activeLang]: value,
    }));
  };

  const currentText = text[activeLang] || "";

  if (!isAdmin) {
    return (
      <div className="flex-1 max-w-[430px] md:max-w-4xl mx-auto w-full px-4 md:px-6 py-6 box-border">
        <p className="text-[var(--text)]">
          {t("admin.accessDenied")}
        </p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--btn-primary-color)] text-sm font-medium"
        >
          {t("admin.goHome")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-[430px] md:max-w-4xl mx-auto w-full px-4 md:px-6 py-6 box-border">
      <h1 className="text-xl md:text-2xl font-semibold text-[var(--text)] m-0 mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-[var(--text-muted)]" aria-hidden="true" />
        {t("admin.title")}
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 mb-6 space-y-3"
      >
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="inline-flex items-center gap-1 rounded-full bg-[var(--surface)] border border-[var(--border)] p-1 mb-1">
          {["lt", "ru", "en"].map((lng) => (
            <button
              key={lng}
              type="button"
              onClick={() => setActiveLang(lng)}
              className={`px-3 py-1.5 text-xs md:text-sm rounded-full font-medium ${
                activeLang === lng
                  ? "bg-[var(--accent)] text-[var(--btn-primary-color)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--border-subtle)]"
              }`}
            >
              {lng.toUpperCase()}
              {text[lng]?.trim() && (
                <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
              )}
            </button>
          ))}
        </div>

        <textarea
          placeholder={t("admin.textPlaceholder")}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)] min-h-[80px]"
          value={currentText}
          onChange={handleTextChange}
        />

        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder={t("admin.versionPlaceholder")}
            className="flex-1 min-w-[140px] rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)]"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
          />
          <div className="flex-1 min-w-[180px]">
            <input
              type="date"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)]"
              value={dateLabel}
              onChange={(e) => setDateLabel(e.target.value)}
            />
          </div>
          <input
            type="text"
            placeholder={t("admin.emojiPlaceholder")}
            className="w-20 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)]"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--btn-primary-color)] text-sm font-medium flex-1 disabled:opacity-50"
          >
            {editingId ? (
              <Save className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Plus className="w-4 h-4" aria-hidden="true" />
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
              onClick={cancelEdit}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--border-subtle)] text-[var(--text)] hover:bg-[var(--border)] transition-colors"
            >
              <X className="w-4 h-4" aria-hidden="true" />
              {t("admin.cancel")}
            </button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        {loading ? (
          <p className="text-[var(--text-muted)] text-sm">{t("admin.loadingUpdates")}</p>
        ) : updates.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm">{t("admin.emptyUpdates")}</p>
        ) : (
          updates.map((u) => (
            <div
              key={u.id}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 flex justify-between gap-3 items-start"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {u.dateLabel && (
                    <span className="text-xs text-[var(--text-muted)]">
                      {u.dateLabel}
                    </span>
                  )}
                  {u.version && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--border-subtle)] text-[var(--text-muted)]">
                      {u.version}
                    </span>
                  )}
                </div>
                <p className="m-0 text-sm text-[var(--text)] whitespace-pre-wrap">
                  {u.emoji || ""} {pickTextByLang(u.text, appLang)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => startEdit(u)}
                  className="inline-flex items-center justify-center rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--text)]"
                  aria-label={t("admin.edit")}
                  title={t("admin.edit")}
                >
                  <Pencil className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(u.id)}
                  className="inline-flex items-center justify-center rounded-lg p-1.5 text-red-500 hover:bg-red-500/10"
                  aria-label={t("admin.delete")}
                  title={t("admin.delete")}
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

