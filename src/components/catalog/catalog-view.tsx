"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { PhotoLightbox } from "@/components/photo-lightbox";
import { CATEGORY_IDS, type CategoryId } from "@/lib/constants";
import type { Dish, LightboxPhoto } from "@/types/api";

const PER_PAGE_OPTIONS = [10, 20, 50] as const;

const SORT_KEYS = ["name", "weight", "priceStudent", "priceTeacher"] as const;
type SortKey = (typeof SORT_KEYS)[number];

const SORT_LABEL_KEYS: Record<SortKey, string> = {
  name: "catalog.filters.name",
  weight: "catalog.filters.weight",
  priceStudent: "catalog.filters.studentPrice",
  priceTeacher: "catalog.filters.teacherPrice",
};

function getItemName(item: Dish, locale: string): string {
  if (locale === "ru" && item.nameRu) return item.nameRu;
  if (locale === "en" && item.nameEn) return item.nameEn;
  return item.name;
}

function sortItems(
  items: Dish[],
  sortBy: SortKey,
  ascending: boolean,
  locale: string
): Dish[] {
  const direction = ascending ? 1 : -1;

  return [...items].sort((a, b) => {
    const left = sortBy === "name" ? getItemName(a, locale) : a[sortBy];
    const right = sortBy === "name" ? getItemName(b, locale) : b[sortBy];

    if (typeof left === "number" && typeof right === "number") {
      return direction * (left - right);
    }
    return direction * String(left).localeCompare(String(right));
  });
}

export function CatalogView({
  dishes,
  loadFailed,
}: {
  dishes: Dish[];
  loadFailed: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale();

  const [category, setCategory] = useState<CategoryId>("sriubos");
  const [filterOpen, setFilterOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<number>(20);
  const [lightboxPhoto, setLightboxPhoto] = useState<LightboxPhoto | null>(null);

  const items = useMemo(() => {
    let list = dishes.filter((dish) => dish.category === category);

    if (search.trim()) {
      const query = search.trim().toLowerCase();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.nameRu?.toLowerCase().includes(query) ||
          item.nameEn?.toLowerCase().includes(query)
      );
    }

    const sorted = sortItems(list, sortBy, sortAsc, locale);

    return [
      ...sorted.filter((item) => item.photoUrl),
      ...sorted.filter((item) => !item.photoUrl),
    ];
  }, [dishes, category, search, sortBy, sortAsc, locale]);

  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const currentPage = Math.min(page, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return items.slice(start, start + perPage);
  }, [items, currentPage, perPage]);

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortAsc((ascending) => !ascending);
    else setSortBy(key);
    setPage(1);
  };

  return (
    <div className="flex-1 max-w-[430px] md:max-w-4xl mx-auto w-full px-4 md:px-6 py-5 box-border">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text)] m-0 mb-2">
        {t("catalog.title")}
      </h1>

      <p className="text-xs md:text-sm text-[var(--text-muted)] mb-4 leading-relaxed">
        {t("catalog.warning")}
      </p>

      <div className="glass rounded-full p-1 mb-4">
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {CATEGORY_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setCategory(id);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all active:scale-95 ${
                category === id
                  ? "bg-[var(--accent)] text-[var(--btn-primary-color)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              {t(`catalog.category.${id}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="glass rounded-[var(--radius-lg)] mb-4 overflow-hidden">
        <button
          type="button"
          onClick={() => setFilterOpen((open) => !open)}
          className="w-full flex items-center justify-between px-4 py-3 text-left text-[var(--text)] font-medium"
        >
          <span>
            {filterOpen
              ? t("catalog.filters.collapse")
              : t("catalog.filters.expand")}
          </span>
          <ChevronDown
            className={`w-5 h-5 transition-transform ${
              filterOpen ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </button>

        {filterOpen && (
          <div className="px-4 pb-4 pt-0 space-y-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
                {t("catalog.filters.name")}
              </label>
              <input
                type="text"
                className="w-full box-border rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-card)] px-3.5 py-2.5 text-sm font-[var(--font-sans)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--text-muted)]/30"
                placeholder={t("catalog.searchPlaceholder")}
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
                {t("catalog.perPage")}
              </span>
              {PER_PAGE_OPTIONS.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => {
                    setPerPage(count);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95 ${
                    perPage === count
                      ? "bg-[var(--accent)] text-[var(--btn-primary-color)]"
                      : "bg-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {SORT_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleSort(key)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1 transition-all active:scale-95 ${
                    sortBy === key
                      ? "bg-[var(--accent)] text-[var(--btn-primary-color)]"
                      : "bg-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {t(SORT_LABEL_KEYS[key])}
                  {sortBy === key && (sortAsc ? " ↑" : " ↓")}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {loadFailed || paginatedItems.length === 0 ? (
        <p className="text-[var(--text-muted)] py-8 text-center">
          {t("catalog.noResults")}
        </p>
      ) : (
        <ul className="list-none p-0 m-0 md:grid md:grid-cols-2 md:gap-4">
          {paginatedItems.map((item) => {
            const name = getItemName(item, locale);

            return (
              <li
                key={item.id}
                className="glass-card rounded-[var(--radius-lg)] mb-3 md:mb-0 overflow-hidden flex animate-glass-rise"
              >
                {item.photoUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxPhoto({ url: item.photoUrl!, name })
                    }
                    className="p-0 border-0 bg-transparent cursor-zoom-in flex-shrink-0 self-stretch w-24 md:w-28 group overflow-hidden"
                    aria-label={name}
                  >
                    <img
                      src={item.photoUrl}
                      alt={name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </button>
                )}

                <div className="flex-1 min-w-0 p-4 flex flex-col justify-between gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-[var(--text)] leading-snug">
                      {name}
                    </span>
                    {item.weight && (
                      <span className="text-xs text-[var(--text-muted)] bg-[var(--border-subtle)] rounded-full px-2.5 py-1 whitespace-nowrap flex-shrink-0">
                        {item.weight}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="flex items-baseline gap-1.5">
                      <span className="text-xs text-[var(--text-muted)]">
                        {t("catalog.priceShort.student")}
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-[var(--text)]">
                        {Number(item.priceStudent ?? 0).toFixed(2)} €
                      </span>
                    </span>
                    <span
                      className="w-px h-4 bg-[var(--border)]"
                      aria-hidden="true"
                    />
                    <span className="flex items-baseline gap-1.5">
                      <span className="text-xs text-[var(--text-muted)]">
                        {t("catalog.priceShort.teacher")}
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-[var(--text)]">
                        {Number(item.priceTeacher ?? 0).toFixed(2)} €
                      </span>
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6 pb-4">
          <button
            type="button"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={currentPage <= 1}
            className="px-4 py-2 rounded-full text-sm font-medium glass text-[var(--text)] disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
          >
            {t("catalog.prev")}
          </button>
          <span className="text-sm text-[var(--text-muted)] tabular-nums">
            {t("catalog.page")} {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            disabled={currentPage >= totalPages}
            className="px-4 py-2 rounded-full text-sm font-medium glass text-[var(--text)] disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
          >
            {t("catalog.next")}
          </button>
        </div>
      )}

      <PhotoLightbox
        photo={lightboxPhoto}
        onClose={() => setLightboxPhoto(null)}
      />
    </div>
  );
}
