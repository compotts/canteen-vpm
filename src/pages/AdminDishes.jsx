import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { UtensilsCrossed, Plus, Trash2, Pencil, X, Save, ChevronDown } from "lucide-react";
import { loadDishes, createDish, updateDish, deleteDish } from "../services/dishes.js";
import { isStoredUserAdmin } from "../services/userStorage.js";
import { CATEGORY_IDS } from "../data/catalog.js";

export default function AdminDishes() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [filterOpen, setFilterOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("sriubos");

  const [editingId, setEditingId] = useState(null);
  const [activeLang, setActiveLang] = useState("lt");
  const [id, setId] = useState("");
  const [category, setCategory] = useState("sriubos");
  const [name, setName] = useState("");
  const [nameRu, setNameRu] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [weight, setWeight] = useState("");
  const [priceStudent, setPriceStudent] = useState("");
  const [priceTeacher, setPriceTeacher] = useState("");

  const isAdmin = isStoredUserAdmin();
  const appLang = i18n.language || "lt";

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const list = await loadDishes(selectedCategory);
        if (!ignore) setDishes(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!ignore) setError(e.message || "Failed to load dishes");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [isAdmin, selectedCategory]);

  const filteredDishes = dishes.filter(d => {
    const q = searchTerm.toLowerCase();
    return d.name.toLowerCase().includes(q) || 
           (d.nameRu && d.nameRu.toLowerCase().includes(q)) ||
           (d.nameEn && d.nameEn.toLowerCase().includes(q));
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (!id || !category || !name) {
        throw new Error("ID, category, and name are required");
      }

      const payload = {
        id,
        category,
        name,
        nameRu,
        nameEn,
        weight: weight || null,
        priceStudent: priceStudent ? parseFloat(priceStudent) : 0,
        priceTeacher: priceTeacher ? parseFloat(priceTeacher) : 0
      };

      if (editingId) {
        const updated = await updateDish(payload);
        setDishes(prev => prev.map(d => d.id === updated.id ? updated : d));
      } else {
        const created = await createDish(payload);
        setDishes(prev => [created, ...prev]);
      }

      setId("");
      setCategory("sriubos");
      setName("");
      setNameRu("");
      setNameEn("");
      setWeight("");
      setPriceStudent("");
      setPriceTeacher("");
      setEditingId(null);
      setActiveLang("lt");
    } catch (e) {
      setError(e.message || "Failed to save dish");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (dishId) => {
    if (!window.confirm("Delete this dish?")) return;
    try {
      await deleteDish(dishId);
      setDishes(prev => prev.filter(d => d.id !== dishId));
    } catch (e) {
      setError(e.message || "Failed to delete dish");
    }
  };

  const startEdit = (dish) => {
    setError(null);
    setEditingId(dish.id);
    setId(dish.id);
    setCategory(dish.category);
    setName(dish.name);
    setNameRu(dish.nameRu || "");
    setNameEn(dish.nameEn || "");
    setWeight(dish.weight || "");
    setPriceStudent(dish.priceStudent ? String(dish.priceStudent) : "");
    setPriceTeacher(dish.priceTeacher ? String(dish.priceTeacher) : "");
    setActiveLang("lt");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setError(null);
    setId("");
    setCategory("sriubos");
    setName("");
    setNameRu("");
    setNameEn("");
    setWeight("");
    setPriceStudent("");
    setPriceTeacher("");
  };

  if (!isAdmin) {
    return (
      <div className="flex-1 max-w-[430px] md:max-w-4xl mx-auto w-full px-4 md:px-6 py-6 box-border">
        <p className="text-[var(--text)]">Access denied</p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--btn-primary-color)] text-sm font-medium"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-[430px] md:max-w-4xl mx-auto w-full px-4 md:px-6 py-6 box-border pb-24">
      <h1 className="text-xl md:text-2xl font-semibold text-[var(--text)] m-0 mb-4 flex items-center gap-2">
        <UtensilsCrossed className="w-5 h-5 text-[var(--text-muted)]" aria-hidden="true" />
        Manage Dishes
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
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Dish ID (e.g., s1, m1, a1)"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)]"
            value={id}
            onChange={(e) => setId(e.target.value)}
            disabled={!!editingId}
          />

          <select
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)]"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORY_IDS.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {activeLang === "lt" && (
            <input
              type="text"
              placeholder="Name (Lithuanian)"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)]"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          {activeLang === "ru" && (
            <input
              type="text"
              placeholder="Name (Russian)"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)]"
              value={nameRu}
              onChange={(e) => setNameRu(e.target.value)}
            />
          )}
          {activeLang === "en" && (
            <input
              type="text"
              placeholder="Name (English)"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)]"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
            />
          )}

          <input
            type="text"
            placeholder="Weight (e.g., 250, 250/20)"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)]"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Student Price"
              step="0.01"
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)]"
              value={priceStudent}
              onChange={(e) => setPriceStudent(e.target.value)}
            />
            <input
              type="number"
              placeholder="Teacher Price"
              step="0.01"
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)]"
              value={priceTeacher}
              onChange={(e) => setPriceTeacher(e.target.value)}
            />
          </div>
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
            {submitting ? "Saving..." : editingId ? "Save Changes" : "Add Dish"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--border-subtle)] text-[var(--text)] hover:bg-[var(--border)] transition-colors"
            >
              <X className="w-4 h-4" aria-hidden="true" />
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-sm)] mb-4 overflow-hidden">
        <button
          type="button"
          onClick={() => setFilterOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-left text-[var(--text)] font-medium hover:bg-[var(--bg-card)] transition-colors"
        >
          <span>{filterOpen ? "Hide Filters" : "Show Filters"}</span>
          <ChevronDown className={`w-5 h-5 transition-transform ${filterOpen ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
        {filterOpen && (
          <div className="px-4 pb-4 pt-0 border-t border-[var(--border)] space-y-3">
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Search</label>
              <input
                type="text"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)]"
                placeholder="Search dishes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Category</label>
              <select
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)]"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {CATEGORY_IDS.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {loading ? (
          <p className="text-[var(--text-muted)] text-sm py-4">Loading dishes...</p>
        ) : filteredDishes.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm py-4">No dishes found</p>
        ) : (
          filteredDishes.map((dish) => (
            <div
              key={dish.id}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 flex justify-between gap-3 items-start"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-md bg-[var(--border-subtle)] text-[var(--text-muted)]">
                    {dish.id}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-[var(--border-subtle)] text-[var(--text-muted)]">
                    {dish.category}
                  </span>
                </div>
                <p className="m-0 text-sm font-medium text-[var(--text)] truncate">{dish.name}</p>
                {dish.nameRu && <p className="m-0 text-xs text-[var(--text-muted)] truncate">{dish.nameRu}</p>}
                <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-muted)]">
                  {dish.weight && <span>{dish.weight}</span>}
                  <span>{dish.priceStudent.toFixed(2)} € / {dish.priceTeacher.toFixed(2)} €</span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => startEdit(dish)}
                  className="inline-flex items-center justify-center rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--text)]"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(dish.id)}
                  className="inline-flex items-center justify-center rounded-lg p-1.5 text-red-500 hover:bg-red-500/10"
                  title="Delete"
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
