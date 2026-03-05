import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CATEGORY_IDS, catalogByCategory } from "../data/catalog.js";

const PER_PAGE_OPTIONS = [10, 20, 50];
const SORT_KEYS = ["name", "weight", "priceStudent", "priceTeacher"];

function getItemName(item, lang) {
  return (lang === "ru" && item.nameRu) ? item.nameRu : item.name;
}

function sortItems(items, sortBy, sortAsc, lang) {
  const sorted = [...items];
  const mult = sortAsc ? 1 : -1;
  sorted.sort((a, b) => {
    const aVal = sortBy === "name" ? getItemName(a, lang) : a[sortBy];
    const bVal = sortBy === "name" ? getItemName(b, lang) : b[sortBy];
    if (typeof aVal === "number" && typeof bVal === "number") return mult * (aVal - bVal);
    return mult * String(aVal).localeCompare(String(bVal));
  });
  return sorted;
}

export default function Catalog() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "lt";
  const [category, setCategory] = useState("sriubos");
  const [filterOpen, setFilterOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const items = useMemo(() => {
    let list = category ? (catalogByCategory[category] || []) : [];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((i) =>
        i.name.toLowerCase().includes(q) || (i.nameRu && i.nameRu.toLowerCase().includes(q))
      );
    }
    return sortItems(list, sortBy, sortAsc, lang);
  }, [category, search, sortBy, sortAsc, lang]);

  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return items.slice(start, start + perPage);
  }, [items, currentPage, perPage]);

  const toggleSort = (key) => {
    if (sortBy === key) setSortAsc((a) => !a);
    else setSortBy(key);
    setPage(1);
  };

  return (
    <div className="flex-1 max-w-[430px] mx-auto w-full px-4 py-5 box-border pb-24">
      <h1 className="text-xl font-semibold text-[var(--text)] m-0 mb-4">{t("catalog.title")}</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        {CATEGORY_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => { setCategory(id); setPage(1); }}
            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
              category === id
                ? "bg-[var(--accent)] text-[var(--btn-primary-color)] border-[var(--accent)]"
                : "bg-[var(--surface)] text-[var(--text)] border-[var(--border)] hover:bg-[var(--border-subtle)]"
            }`}
          >
            {t(`catalog.category.${id}`)}
          </button>
        ))}
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-sm)] mb-4 overflow-hidden">
        <button
          type="button"
          onClick={() => setFilterOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-left text-[var(--text)] font-medium hover:bg-[var(--bg-card)] transition-colors"
        >
          <span>{filterOpen ? t("catalog.filters.collapse") : t("catalog.filters.expand")}</span>
          <svg className={`w-5 h-5 transition-transform ${filterOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        {filterOpen && (
          <div className="px-4 pb-4 pt-0 border-t border-[var(--border)] space-y-3">
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">{t("catalog.filters.name")}</label>
              <input
                type="text"
                className="input w-full box-border rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm font-[var(--font-sans)] text-[var(--text)]"
                placeholder={t("catalog.searchPlaceholder")}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-[var(--text-muted)]">{t("catalog.perPage")}:</span>
              {PER_PAGE_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => { setPerPage(n); setPage(1); }}
                  className={`px-2 py-1 rounded text-sm ${perPage === n ? "bg-[var(--accent)] text-[var(--btn-primary-color)]" : "bg-[var(--border-subtle)] text-[var(--text)]"}`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {SORT_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleSort(key)}
                  className={`px-2 py-1 rounded text-sm flex items-center gap-1 ${
                    sortBy === key ? "bg-[var(--accent)] text-[var(--btn-primary-color)]" : "bg-[var(--border-subtle)] text-[var(--text)]"
                  }`}
                >
                  {t(`catalog.filters.${key === "name" ? "name" : key === "weight" ? "weight" : key === "priceStudent" ? "studentPrice" : "teacherPrice"}`)}
                  {sortBy === key && (sortAsc ? " ↑" : " ↓")}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-2 px-2 py-2 text-sm font-semibold text-[var(--text-muted)] border-b border-[var(--border)]">
        <button type="button" onClick={() => toggleSort("name")} className="text-left">
          {t("catalog.filters.name")} {sortBy === "name" && (sortAsc ? "↑" : "↓")}
        </button>
        <button type="button" onClick={() => toggleSort("weight")} className="text-right">
          {t("catalog.filters.weight")} {sortBy === "weight" && (sortAsc ? "↑" : "↓")}
        </button>
        <button type="button" onClick={() => toggleSort("priceStudent")} className="text-right">
          {t("catalog.filters.studentPrice")} {sortBy === "priceStudent" && (sortAsc ? "↑" : "↓")}
        </button>
        <button type="button" onClick={() => toggleSort("priceTeacher")} className="text-right">
          {t("catalog.filters.teacherPrice")} {sortBy === "priceTeacher" && (sortAsc ? "↑" : "↓")}
        </button>
      </div>

      {paginatedItems.length === 0 ? (
        <p className="text-[var(--text-muted)] py-8 text-center">{t("catalog.noResults")}</p>
      ) : (
        <ul className="list-none p-0 m-0">
          {paginatedItems.map((item) => (
            <li
              key={item.id}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 mb-3 shadow-[var(--shadow-sm)]"
            >
              <div className="font-medium text-[var(--text)] mb-2">{getItemName(item, lang)}</div>
              <div className="grid grid-cols-3 gap-2 text-sm text-[var(--text-muted)]">
                <span><span className="text-[var(--text-muted)] opacity-80">{t("catalog.filters.weight")}:</span> {item.weight}</span>
                <span><span className="text-[var(--text-muted)] opacity-80">{t("catalog.filters.studentPrice")}:</span> {item.priceStudent.toFixed(2)} €</span>
                <span><span className="text-[var(--text-muted)] opacity-80">{t("catalog.filters.teacherPrice")}:</span> {item.priceTeacher.toFixed(2)} €</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6 pb-4">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-[var(--border-subtle)] text-[var(--text)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("catalog.prev")}
          </button>
          <span className="text-sm text-[var(--text-muted)]">
            {t("catalog.page")} {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-[var(--border-subtle)] text-[var(--text)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("catalog.next")}
          </button>
        </div>
      )}
    </div>
  );
}
