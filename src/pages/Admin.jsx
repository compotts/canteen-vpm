import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Clock, Plus, Trash2, Pencil, X, Save, Upload, Image as ImageIcon } from "lucide-react";
import { createUpdate, deleteUpdate, loadUpdates, updateUpdate } from "../services/updates.js";
import { loadTranslations, createTranslation, updateTranslation, deleteTranslation } from "../services/translations.js";
import { loadDishes } from "../services/dishes.js";
import { uploadPhoto, deletePhoto } from "../services/photos.js";
import { isStoredUserAdmin } from "../services/userStorage.js";
import { pickTextByLang } from "../utils/textHelpers.js";

export default function Admin() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isAdmin = isStoredUserAdmin();
  const appLang = i18n.language || "lt";

  const [activeTab, setActiveTab] = useState("updates");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [updates, setUpdates] = useState([]);
  const [editingUpdateId, setEditingUpdateId] = useState(null);
  const [updateActiveLang, setUpdateActiveLang] = useState("lt");
  const [version, setVersion] = useState("");
  const [dateLabel, setDateLabel] = useState("");
  const [emoji, setEmoji] = useState("");
  const [updateText, setUpdateText] = useState({ lt: "", ru: "", en: "" });

  const [translations, setTranslations] = useState([]);
  const [translationSearch, setTranslationSearch] = useState("");
  const [editingTranslationId, setEditingTranslationId] = useState(null);
  const [translationName, setTranslationName] = useState("");
  const [translationNameRu, setTranslationNameRu] = useState("");
  const [translationNameEn, setTranslationNameEn] = useState("");

  const [photoSource, setPhotoSource] = useState("dishes");
  const [photoItems, setPhotoItems] = useState([]);
  const [photoSearch, setPhotoSearch] = useState("");
  const [uploadingPhotoId, setUploadingPhotoId] = useState(null);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (activeTab === "updates") {
          const list = await loadUpdates();
          setUpdates(Array.isArray(list) ? list : []);
        } else if (activeTab === "dishes") {
          const list = await loadTranslations();
          setTranslations(Array.isArray(list) ? list : []);
        } else {
          const list = photoSource === "dishes" ? await loadDishes() : await loadTranslations();
          setPhotoItems(Array.isArray(list) ? list : []);
        }
      } catch (e) {
        setError(e.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin, activeTab, photoSource]);

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...(editingUpdateId ? { id: editingUpdateId } : {}),
        version: version || null,
        dateLabel: dateLabel || null,
        emoji: emoji || null,
        text: updateText,
      };

      if (!Object.values(updateText).some(v => v?.trim())) {
        throw new Error(t("admin.atLeastOneLanguageRequired"));
      }

      if (editingUpdateId) {
        const updated = await updateUpdate(payload);
        setUpdates(prev => prev.map(u => u.id === updated.id ? updated : u));
      } else {
        const created = await createUpdate(payload);
        setUpdates(prev => [created, ...prev]);
      }
      resetUpdateForm();
    } catch (e) {
      setError(e.message || t("admin.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const resetUpdateForm = () => {
    setVersion("");
    setDateLabel("");
    setEmoji("");
    setUpdateText({ lt: "", ru: "", en: "" });
    setEditingUpdateId(null);
  };

  const handleUpdateDelete = async (id) => {
    if (!window.confirm(t("admin.deleteConfirm"))) return;
    await deleteUpdate(id);
    setUpdates(prev => prev.filter(u => u.id !== id));
  };

  const startUpdateEdit = (u) => {
    setEditingUpdateId(u.id);
    setVersion(u.version || "");
    setDateLabel(u.dateLabel || "");
    setEmoji(u.emoji || "");
    setUpdateText({
      lt: u.text?.lt || "",
      ru: u.text?.ru || "",
      en: u.text?.en || "",
    });
    setUpdateActiveLang("lt");
  };

  const handleTranslationSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (!translationName) {
        throw new Error("Name is required");
      }

      const payload = {
        ...(editingTranslationId ? { id: editingTranslationId } : {}),
        name: translationName,
        nameRu: translationNameRu || null,
        nameEn: translationNameEn || null
      };

      if (editingTranslationId) {
        const updated = await updateTranslation(payload);
        setTranslations(prev => prev.map(t => t.id === updated.id ? updated : t));
      } else {
        const created = await createTranslation(payload);
        setTranslations(prev => [...prev, created]);
      }
      resetTranslationForm();
    } catch (e) {
      setError(e.message || "Failed to save translation");
    } finally {
      setSubmitting(false);
    }
  };

  const resetTranslationForm = () => {
    setTranslationName("");
    setTranslationNameRu("");
    setTranslationNameEn("");
    setEditingTranslationId(null);
  };

  const handleTranslationDelete = async (id) => {
    if (!window.confirm(t("admin.dishes.deleteConfirm"))) return;
    await deleteTranslation(id);
    setTranslations(prev => prev.filter(t => t.id !== id));
  };

  const startTranslationEdit = (tr) => {
    setEditingTranslationId(tr.id);
    setTranslationName(tr.name);
    setTranslationNameRu(tr.nameRu || "");
    setTranslationNameEn(tr.nameEn || "");
  };

  const filteredTranslations = useMemo(() => {
    const q = translationSearch.toLowerCase().trim();
    if (!q) return translations;
    return translations.filter(t =>
      t.name.toLowerCase().includes(q) ||
      (t.nameRu && t.nameRu.toLowerCase().includes(q)) ||
      (t.nameEn && t.nameEn.toLowerCase().includes(q))
    );
  }, [translations, translationSearch]);

  const handlePhotoUpload = async (item, file) => {
    if (!file) return;
    setUploadingPhotoId(item.id);
    setError(null);
    try {
      const { photoUrl } = await uploadPhoto(photoSource, item.id, file);
      setPhotoItems(prev => prev.map(p => p.id === item.id ? { ...p, photoUrl } : p));
    } catch (e) {
      setError(e.message || t("admin.photos.uploadError"));
    } finally {
      setUploadingPhotoId(null);
    }
  };

  const handlePhotoDelete = async (item) => {
    if (!window.confirm(t("admin.photos.deleteConfirm"))) return;
    setError(null);
    try {
      await deletePhoto(photoSource, item.id);
      setPhotoItems(prev => prev.map(p => p.id === item.id ? { ...p, photoUrl: null } : p));
    } catch (e) {
      setError(e.message || t("admin.photos.uploadError"));
    }
  };

  const filteredPhotoItems = useMemo(() => {
    const q = photoSearch.toLowerCase().trim();
    if (!q) return photoItems;
    return photoItems.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.nameRu && p.nameRu.toLowerCase().includes(q)) ||
      (p.nameEn && p.nameEn.toLowerCase().includes(q))
    );
  }, [photoItems, photoSearch]);

  if (!isAdmin) {
    return (
      <div className="flex-1 max-w-[430px] md:max-w-4xl mx-auto w-full px-4 md:px-6 py-6 box-border">
        <p className="text-[var(--text)]">{t("admin.accessDenied")}</p>
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
    <div className="flex-1 max-w-[430px] md:max-w-4xl mx-auto w-full px-4 md:px-6 py-6 box-border pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-semibold text-[var(--text)] m-0 flex items-center gap-2">
          <Clock className="w-5 h-5 text-[var(--text-muted)]" />
          {activeTab === "updates" ? t("admin.title") : activeTab === "dishes" ? t("admin.dishesTitle") : t("admin.photosTitle")}
        </h1>
        <div className="flex bg-[var(--surface)] border border-[var(--border)] rounded-lg p-1">
          <button
            onClick={() => { setActiveTab("updates"); setError(null); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === "updates" ? "bg-[var(--accent)] text-[var(--btn-primary-color)]" : "text-[var(--text-muted)] hover:bg-[var(--border-subtle)]"}`}
          >
            {t("admin.tabs.updates")}
          </button>
          <button
            onClick={() => { setActiveTab("dishes"); setError(null); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === "dishes" ? "bg-[var(--accent)] text-[var(--btn-primary-color)]" : "text-[var(--text-muted)] hover:bg-[var(--border-subtle)]"}`}
          >
            {t("admin.tabs.dishes")}
          </button>
          <button
            onClick={() => { setActiveTab("photos"); setError(null); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === "photos" ? "bg-[var(--accent)] text-[var(--btn-primary-color)]" : "text-[var(--text-muted)] hover:bg-[var(--border-subtle)]"}`}
          >
            {t("admin.tabs.photos")}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300 mb-4">
          {error}
        </div>
      )}

      {activeTab === "updates" ? (
        <>
          <form onSubmit={handleUpdateSubmit} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 mb-6 space-y-3">
            <div className="inline-flex items-center gap-1 rounded-full bg-[var(--surface)] border border-[var(--border)] p-1 mb-1">
              {["lt", "ru", "en"].map((lng) => (
                <button
                  key={lng}
                  type="button"
                  onClick={() => setUpdateActiveLang(lng)}
                  className={`px-3 py-1.5 text-xs md:text-sm rounded-full font-medium ${updateActiveLang === lng ? "bg-[var(--accent)] text-[var(--btn-primary-color)]" : "text-[var(--text-muted)] hover:bg-[var(--border-subtle)]"}`}
                >
                  {lng.toUpperCase()}
                  {updateText[lng]?.trim() && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-green-500" />}
                </button>
              ))}
            </div>
            <textarea
              placeholder={t("admin.textPlaceholder")}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)] min-h-[80px]"
              value={updateText[updateActiveLang] || ""}
              onChange={(e) => setUpdateText(prev => ({ ...prev, [updateActiveLang]: e.target.value }))}
            />
            <div className="flex flex-wrap gap-3">
              <input type="text" placeholder={t("admin.versionPlaceholder")} className="flex-1 min-w-[140px] rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)]" value={version} onChange={(e) => setVersion(e.target.value)} />
              <input type="date" className="flex-1 min-w-[180px] rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)]" value={dateLabel} onChange={(e) => setDateLabel(e.target.value)} />
              <input type="text" placeholder={t("admin.emojiPlaceholder")} className="w-20 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)]" value={emoji} onChange={(e) => setEmoji(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--btn-primary-color)] text-sm font-medium flex-1 disabled:opacity-50">
                {editingUpdateId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {submitting ? t("admin.saving") : editingUpdateId ? t("admin.saveChanges") : t("admin.addUpdate")}
              </button>
              {editingUpdateId && (
                <button type="button" onClick={resetUpdateForm} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--border-subtle)] text-[var(--text)] hover:bg-[var(--border)] transition-colors">
                  <X className="w-4 h-4" /> {t("admin.cancel")}
                </button>
              )}
            </div>
          </form>
          <div className="space-y-3">
            {loading ? <p className="text-[var(--text-muted)] text-sm">{t("admin.loadingUpdates")}</p> : updates.length === 0 ? <p className="text-[var(--text-muted)] text-sm">{t("admin.emptyUpdates")}</p> : updates.map((u) => (
              <div key={u.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 flex justify-between gap-3 items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {u.dateLabel && <span className="text-xs text-[var(--text-muted)]">{u.dateLabel}</span>}
                    {u.version && <span className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--border-subtle)] text-[var(--text-muted)]">{u.version}</span>}
                  </div>
                  <p className="m-0 text-sm text-[var(--text)] whitespace-pre-wrap">{u.emoji || ""} {pickTextByLang(u.text, appLang)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => startUpdateEdit(u)} className="p-1.5 text-[var(--text-muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--text)] rounded-lg"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleUpdateDelete(u.id)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : activeTab === "dishes" ? (
        <>
          <form onSubmit={handleTranslationSubmit} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 mb-6 space-y-3">
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">{t("catalog.filters.name")}</label>
                <input type="text" placeholder="Agurkinė sriuba" className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)]" value={translationName} onChange={(e) => setTranslationName(e.target.value)} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">{t("catalog.filters.name")} (RU)</label>
                  <input type="text" placeholder="Огуречный суп" className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)]" value={translationNameRu} onChange={(e) => setTranslationNameRu(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">{t("catalog.filters.name")} (EN)</label>
                  <input type="text" placeholder="Cucumber soup" className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)]" value={translationNameEn} onChange={(e) => setTranslationNameEn(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--btn-primary-color)] text-sm font-medium flex-1 disabled:opacity-50">
                {editingTranslationId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {submitting ? t("admin.dishes.saving") : editingTranslationId ? t("admin.dishes.save") : t("admin.dishes.add")}
              </button>
              {editingTranslationId && (
                <button type="button" onClick={resetTranslationForm} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--border-subtle)] text-[var(--text)] hover:bg-[var(--border)] transition-colors">
                  <X className="w-4 h-4" /> {t("admin.dishes.cancel")}
                </button>
              )}
            </div>
          </form>

          <div className="mb-4">
            <input type="text" className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)]" placeholder={t("admin.dishes.searchPlaceholder")} value={translationSearch} onChange={(e) => setTranslationSearch(e.target.value)} />
          </div>

          <div className="space-y-2">
            {loading ? <p className="text-[var(--text-muted)] text-sm py-4">{t("admin.dishes.loading")}</p> : filteredTranslations.length === 0 ? <p className="text-[var(--text-muted)] text-sm py-4">{t("admin.dishes.noResults")}</p> : filteredTranslations.map((tr) => (
              <div key={tr.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 flex justify-between gap-3 items-start">
                <div className="flex-1 min-w-0">
                  <p className="m-0 text-sm font-medium text-[var(--text)]">{appLang === 'ru' ? (tr.nameRu || tr.name) : appLang === 'en' ? (tr.nameEn || tr.name) : tr.name}</p>
                  <div className="mt-1 space-y-0.5 text-xs text-[var(--text-muted)]">
                    {tr.nameRu && <p className="m-0">{tr.nameRu}</p>}
                    {tr.nameEn && <p className="m-0">{tr.nameEn}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => startTranslationEdit(tr)} className="p-1.5 text-[var(--text-muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--text)] rounded-lg"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleTranslationDelete(tr.id)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="inline-flex items-center gap-1 rounded-full bg-[var(--surface)] border border-[var(--border)] p-1 mb-4">
            {["dishes", "translations"].map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => { setPhotoSource(src); setPhotoSearch(""); }}
                className={`px-3 py-1.5 text-xs md:text-sm rounded-full font-medium ${photoSource === src ? "bg-[var(--accent)] text-[var(--btn-primary-color)]" : "text-[var(--text-muted)] hover:bg-[var(--border-subtle)]"}`}
              >
                {t(`admin.photos.source.${src}`)}
              </button>
            ))}
          </div>

          <div className="mb-4">
            <input type="text" className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)]" placeholder={t("admin.dishes.searchPlaceholder")} value={photoSearch} onChange={(e) => setPhotoSearch(e.target.value)} />
          </div>

          <div className="space-y-2">
            {loading ? <p className="text-[var(--text-muted)] text-sm py-4">{t("admin.dishes.loading")}</p> : filteredPhotoItems.length === 0 ? <p className="text-[var(--text-muted)] text-sm py-4">{t("admin.dishes.noResults")}</p> : filteredPhotoItems.map((item) => (
              <div key={item.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 flex items-center gap-3">
                {item.photoUrl ? (
                  <img src={item.photoUrl} alt={item.name} loading="lazy" className="w-14 h-14 object-cover rounded-lg flex-shrink-0 border border-[var(--border)]" />
                ) : (
                  <div className="w-14 h-14 rounded-lg flex-shrink-0 border border-dashed border-[var(--border)] flex items-center justify-center text-[var(--text-muted)]">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="m-0 text-sm font-medium text-[var(--text)]">{appLang === 'ru' ? (item.nameRu || item.name) : appLang === 'en' ? (item.nameEn || item.name) : item.name}</p>
                  <div className="mt-1 space-y-0.5 text-xs text-[var(--text-muted)]">
                    {item.nameRu && <p className="m-0">{item.nameRu}</p>}
                    {item.nameEn && <p className="m-0">{item.nameEn}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <label className={`p-1.5 rounded-lg cursor-pointer text-[var(--text-muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--text)] ${uploadingPhotoId === item.id ? "opacity-50 pointer-events-none" : ""}`}>
                    <Upload className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingPhotoId !== null}
                      onChange={(e) => { handlePhotoUpload(item, e.target.files?.[0]); e.target.value = ""; }}
                    />
                  </label>
                  {item.photoUrl && (
                    <button onClick={() => handlePhotoDelete(item)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
