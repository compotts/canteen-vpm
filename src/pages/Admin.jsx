import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Clock, Plus, Trash2, Pencil, X, Save, UtensilsCrossed, ChevronDown } from "lucide-react";
import { createUpdate, deleteUpdate, loadUpdates, updateUpdate } from "../services/updates.js";
import { loadDishes, createDish, updateDish, deleteDish } from "../services/dishes.js";
import { isStoredUserAdmin } from "../services/userStorage.js";
import { pickTextByLang } from "../utils/textHelpers.js";
import { CATEGORY_IDS } from "../data/catalog.js";

export default function Admin() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isAdmin = isStoredUserAdmin();
  const appLang = i18n.language || "lt";

  const [activeTab, setActiveTab] = useState("updates"); // "updates" or "dishes"
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Updates State
  const [updates, setUpdates] = useState([]);
  const [editingUpdateId, setEditingUpdateId] = useState(null);
  const [updateActiveLang, setUpdateActiveLang] = useState("lt");
  const [version, setVersion] = useState("");
  const [dateLabel, setDateLabel] = useState("");
  const [emoji, setEmoji] = useState("");
  const [updateText, setUpdateText] = useState({ lt: "", ru: "", en: "" });

  // Dishes State
  const [dishes, setDishes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("sriubos");
  const [dishSearch, setDishSearch] = useState("");
  const [dishFilterOpen, setDishFilterOpen] = useState(true);
  const [editingDishId, setEditingDishId] = useState(null);
  const [dishId, setDishId] = useState("");
  const [dishCategory, setDishCategory] = useState("sriubos");
  const [dishName, setDishName] = useState("");
  const [dishNameRu, setDishNameRu] = useState("");
  const [dishNameEn, setDishNameEn] = useState("");
  const [dishWeight, setDishWeight] = useState("");
  const [dishPriceStudent, setDishPriceStudent] = useState("");
  const [dishPriceTeacher, setDishPriceTeacher] = useState("");

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
        } else {
          const list = await loadDishes(selectedCategory);
          setDishes(Array.isArray(list) ? list : []);
        }
      } catch (e) {
        setError(e.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin, activeTab, selectedCategory]);

  // Update Handlers
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

  // Dish Handlers
  const handleDishSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (!dishId || !dishCategory || !dishName) {
        throw new Error("ID, category, and name are required");
      }

      const payload = {
        id: dishId,
        category: dishCategory,
        name: dishName,
        nameRu: dishNameRu || null,
        nameEn: dishNameEn || null,
        weight: dishWeight || null,
        priceStudent: dishPriceStudent ? parseFloat(dishPriceStudent) : 0,
        priceTeacher: dishPriceTeacher ? parseFloat(dishPriceTeacher) : 0
      };

      if (editingDishId) {
        const updated = await updateDish(payload);
        setDishes(prev => prev.map(d => d.id === updated.id ? updated : d));
      } else {
        const created = await createDish(payload);
        setDishes(prev => [created, ...prev]);
      }
      resetDishForm();
    } catch (e) {
      setError(e.message || "Failed to save dish");
    } finally {
      setSubmitting(false);
    }
  };

  const resetDishForm = () => {
    setDishId("");
    setDishCategory("sriubos");
    setDishName("");
    setDishNameRu("");
    setDishNameEn("");
    setDishWeight("");
    setDishPriceStudent("");
    setDishPriceTeacher("");
    setEditingDishId(null);
  };

  const handleDishDelete = async (id) => {
    if (!window.confirm(t("admin.dishes.deleteConfirm"))) return;
    await deleteDish(id);
    setDishes(prev => prev.filter(d => d.id !== id));
  };

  const startDishEdit = (d) => {
    setEditingDishId(d.id);
    setDishId(d.id);
    setDishCategory(d.category);
    setDishName(d.name);
    setDishNameRu(d.nameRu || "");
    setDishNameEn(d.nameEn || "");
    setDishWeight(d.weight || "");
    setDishPriceStudent(d.priceStudent ? String(d.priceStudent) : "");
    setDishPriceTeacher(d.priceTeacher ? String(d.priceTeacher) : "");
  };

  const filteredDishes = useMemo(() => {
    const q = dishSearch.toLowerCase().trim();
    if (!q) return dishes;
    return dishes.filter(d => 
      d.name.toLowerCase().includes(q) || 
      (d.nameRu && d.nameRu.toLowerCase().includes(q)) ||
      (d.nameEn && d.nameEn.toLowerCase().includes(q))
    );
  }, [dishes, dishSearch]);

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
          {activeTab === "updates" ? (
            <Clock className="w-5 h-5 text-[var(--text-muted)]" />
          ) : (
            <UtensilsCrossed className="w-5 h-5 text-[var(--text-muted)]" />
          )}
          {activeTab === "updates" ? t("admin.title") : t("admin.dishesTitle")}
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
      ) : (
        <>
          <form onSubmit={handleDishSubmit} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 mb-6 space-y-3">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-24">
                  <label className="block text-[10px] font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">ID</label>
                  <input type="text" placeholder={t("admin.dishes.idPlaceholder")} className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)]" value={dishId} onChange={(e) => setDishId(e.target.value)} disabled={!!editingDishId} />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">{t("admin.dishes.categoryLabel")}</label>
                  <select className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)]" value={dishCategory} onChange={(e) => setDishCategory(e.target.value)}>
                    {CATEGORY_IDS.map(cat => <option key={cat} value={cat}>{t(`catalog.category.${cat}`)}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">{t("catalog.filters.name")}</label>
                  <input type="text" placeholder="Agurkinė sriuba" className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)]" value={dishName} onChange={(e) => setDishName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">{t("catalog.filters.name")} (RU)</label>
                  <input type="text" placeholder="Огуречный суп" className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)]" value={dishNameRu} onChange={(e) => setDishNameRu(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">{t("catalog.filters.name")} (EN)</label>
                  <input type="text" placeholder="Cucumber soup" className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)]" value={dishNameEn} onChange={(e) => setDishNameEn(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">{t("catalog.filters.weight")}</label>
                  <input type="text" placeholder={t("admin.dishes.weightPlaceholder")} className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)]" value={dishWeight} onChange={(e) => setDishWeight(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">{t("catalog.filters.studentPrice")}</label>
                  <input type="number" step="0.01" placeholder={t("admin.dishes.studentPricePlaceholder")} className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)]" value={dishPriceStudent} onChange={(e) => setDishPriceStudent(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">{t("catalog.filters.teacherPrice")}</label>
                  <input type="number" step="0.01" placeholder={t("admin.dishes.teacherPricePlaceholder")} className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)]" value={dishPriceTeacher} onChange={(e) => setDishPriceTeacher(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--btn-primary-color)] text-sm font-medium flex-1 disabled:opacity-50">
                {editingDishId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {submitting ? t("admin.dishes.saving") : editingDishId ? t("admin.dishes.save") : t("admin.dishes.add")}
              </button>
              {editingDishId && (
                <button type="button" onClick={resetDishForm} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--border-subtle)] text-[var(--text)] hover:bg-[var(--border)] transition-colors">
                  <X className="w-4 h-4" /> {t("admin.dishes.cancel")}
                </button>
              )}
            </div>
          </form>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-sm)] mb-4 overflow-hidden">
            <button onClick={() => setDishFilterOpen(!dishFilterOpen)} className="w-full flex items-center justify-between px-4 py-3 text-left text-[var(--text)] font-medium hover:bg-[var(--border-subtle)] transition-colors">
              <span>{dishFilterOpen ? t("admin.dishes.hideFilters") : t("admin.dishes.showFilters")}</span>
              <ChevronDown className={`w-5 h-5 transition-transform ${dishFilterOpen ? "rotate-180" : ""}`} />
            </button>
            {dishFilterOpen && (
              <div className="px-4 pb-4 pt-0 border-t border-[var(--border)] space-y-3">
                <div className="pt-3">
                  <input type="text" className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)]" placeholder={t("admin.dishes.searchPlaceholder")} value={dishSearch} onChange={(e) => setDishSearch(e.target.value)} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_IDS.map(cat => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${selectedCategory === cat ? "bg-[var(--accent)] text-[var(--btn-primary-color)] border-[var(--accent)]" : "bg-[var(--surface)] text-[var(--text)] border-[var(--border)] hover:bg-[var(--border-subtle)]"}`}>
                      {t(`catalog.category.${cat}`)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {loading ? <p className="text-[var(--text-muted)] text-sm py-4">{t("admin.dishes.loading")}</p> : filteredDishes.length === 0 ? <p className="text-[var(--text-muted)] text-sm py-4">{t("admin.dishes.noResults")}</p> : filteredDishes.map((dish) => (
              <div key={dish.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 flex justify-between gap-3 items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-[var(--border-subtle)] text-[var(--text-muted)]">{dish.id}</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-[var(--border-subtle)] text-[var(--text-muted)]">{t(`catalog.category.${dish.category}`)}</span>
                  </div>
                  <p className="m-0 text-sm font-medium text-[var(--text)] truncate">{appLang === 'ru' ? (dish.nameRu || dish.name) : appLang === 'en' ? (dish.nameEn || dish.name) : dish.name}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-muted)]">
                    {dish.weight && <span>{dish.weight}</span>}
                    <span>{dish.priceStudent.toFixed(2)} € / {dish.priceTeacher.toFixed(2)} €</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => startDishEdit(dish)} className="p-1.5 text-[var(--text-muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--text)] rounded-lg"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDishDelete(dish.id)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
