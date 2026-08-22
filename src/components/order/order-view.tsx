"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LOGOUT_EVENT } from "@/components/auth-provider";
import { PhotoLightbox } from "@/components/photo-lightbox";
import { SECTION_TITLE_KEYS } from "@/lib/constants";
import { normalizeDishName } from "@/lib/text";
import { ApiError } from "@/lib/api/client";
import {
  removeOrderByMenuDate,
  saveOrderToHistory,
  type OrderInput,
} from "@/lib/api/history";
import {
  getOrderMakePage,
  getOrderPage,
  submitOrder,
} from "@/lib/valgykla/client";
import { parseMenuFromHtml, parseOrderMakeLink } from "@/lib/valgykla/parse";
import { loadDishTranslations } from "@/lib/valgykla/translations";
import type {
  DishTranslationMap,
  Menu,
  MenuItem,
  OrderLink,
} from "@/lib/valgykla/types";
import type { LightboxPhoto, OrderItem } from "@/types/api";

type Quantities = Record<string, string>;

function parseQuantity(value: string | undefined): number {
  if (value === "" || value == null) return 0;
  return parseFloat(String(value).replace(",", ".")) || 0;
}

function getDishDisplayName(
  item: MenuItem,
  locale: string,
  translations: DishTranslationMap
): string {
  const trimmed = (item.name || "").trim();
  const entry = translations[normalizeDishName(item.name || "")];
  if (!entry) return trimmed;

  if (locale === "ru") return entry.ru || trimmed;
  if (locale === "en") return entry.en || trimmed;
  return trimmed;
}

function getDishPhoto(
  item: MenuItem,
  translations: DishTranslationMap
): string | null {
  return translations[normalizeDishName(item.name || "")]?.photo ?? null;
}

function buildHistoryOrder(
  menu: Menu,
  quantities: Quantities,
  locale: string,
  translations: DishTranslationMap,
  menuDate: string
): OrderInput | null {
  const items: OrderItem[] = [];

  for (const section of menu.sections) {
    for (const item of section.items) {
      const quantity = parseQuantity(quantities[item.id]);
      if (quantity <= 0) continue;

      const pricePerUnit = typeof item.price === "number" ? item.price : 0;
      items.push({
        id: item.id,
        name: getDishDisplayName(item, locale, translations),
        weight: item.weight || "",
        quantity,
        pricePerUnit,
        totalPrice: pricePerUnit * quantity,
      });
    }
  }

  if (!items.length) return null;

  return {
    menuDate,
    items,
    orderTotal: items.reduce((sum, item) => sum + item.totalPrice, 0),
  };
}

function TotalBar({
  total,
  submitting,
  variant,
}: {
  total: number;
  submitting: boolean;
  variant: "inline" | "fixed";
}) {
  const t = useTranslations();
  const isFixed = variant === "fixed";

  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-[var(--radius-lg)] px-5 py-3.5 ${
        isFixed ? "glass-strong" : "glass-card mt-4 md:mt-6"
      }`}
    >
      <div className="flex flex-col leading-tight">
        <span className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-medium">
          {t("menu.total")}
        </span>
        <strong className="text-[var(--text)] text-xl md:text-2xl tabular-nums">
          {total.toFixed(2)} €
        </strong>
      </div>
      <button
        form="order-form"
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center font-[var(--font-sans)] text-base font-semibold py-2.5 px-6 rounded-full border-none cursor-pointer bg-[var(--accent)] text-[var(--btn-primary-color)] disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-95 transition-all"
      >
        {submitting ? t("menu.submitting") : t("menu.submit")}
      </button>
    </div>
  );
}

export function OrderView() {
  const t = useTranslations();
  const locale = useLocale();

  const [translations, setTranslations] = useState<DishTranslationMap>({});
  const [linkInfo, setLinkInfo] = useState<OrderLink | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [quantities, setQuantities] = useState<Quantities>({});
  const [loading, setLoading] = useState(true);
  const [menuLoading, setMenuLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [inlineVisible, setInlineVisible] = useState(true);
  const [lightboxPhoto, setLightboxPhoto] = useState<LightboxPhoto | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = sentinelRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInlineVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [menu]);

  const loadOrderLink = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const html = await getOrderMakePage();
      setLinkInfo(parseOrderMakeLink(html));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.dispatchEvent(new Event(LOGOUT_EVENT));
      } else {
        setError(true);
      }
      setLinkInfo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrderLink();
    loadDishTranslations().then(setTranslations);
  }, [loadOrderLink]);

  useEffect(() => {
    if (!submitSuccess) return;
    const timeout = setTimeout(() => setSubmitSuccess(false), 2200);
    return () => clearTimeout(timeout);
  }, [submitSuccess]);

  const loadMenuForDate = useCallback(async (date: string) => {
    setMenuLoading(true);
    setMenu(null);

    try {
      setTranslations(await loadDishTranslations());
      const parsed = parseMenuFromHtml(await getOrderPage(date), date);
      setMenu(parsed);

      const initial: Quantities = {};
      for (const section of parsed.sections) {
        for (const item of section.items) {
          const value = (item.initialQuantity ?? "").trim();
          initial[item.id] = value === "" ? "" : value.replace(",", ".");
        }
      }
      setQuantities(initial);
      setSubmitSuccess(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.dispatchEvent(new Event(LOGOUT_EVENT));
      }
      setMenu(null);
    } finally {
      setMenuLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDate) loadMenuForDate(selectedDate);
  }, [selectedDate, loadMenuForDate]);

  const backToDateChoice = () => {
    setSelectedDate(null);
    setMenu(null);
    setSubmitSuccess(false);
  };

  const setQuantity = (id: number, value: string) => {
    setQuantities((previous) => ({ ...previous, [id]: value }));
    setSubmitSuccess(false);
  };

  const total = menu
    ? menu.sections.reduce(
        (sum, section) =>
          sum +
          section.items.reduce(
            (sectionSum, item) =>
              sectionSum + item.price * parseQuantity(quantities[item.id]),
            0
          ),
        0
      )
    : 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!menu || !selectedDate) return;

    setSubmitting(true);
    setSubmitSuccess(false);

    try {
      const map = await loadDishTranslations();
      setTranslations(map);

      const payload: Quantities = {};
      for (const section of menu.sections) {
        for (const item of section.items) {
          const value = quantities[item.id];
          payload[item.id] =
            value === "" || value == null ? "" : String(value).replace(",", ".");
        }
      }

      await submitOrder(selectedDate, payload);
      setSubmitSuccess(true);

      const historyOrder = buildHistoryOrder(
        menu,
        quantities,
        locale,
        map,
        selectedDate
      );
      if (historyOrder) await saveOrderToHistory(historyOrder);
      else await removeOrderByMenuDate(selectedDate);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.dispatchEvent(new Event(LOGOUT_EVENT));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const sectionTitle = (title: string): string => {
    if (!title) return "";
    const key = SECTION_TITLE_KEYS[title.trim().toLowerCase()];
    return key ? t(key) : title;
  };

  const inputClass =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-base text-right text-[var(--text)] max-w-[80px] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--text-muted)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]";

  if (loading) {
    return (
      <div className="flex-1 max-w-[430px] md:max-w-4xl mx-auto w-full px-4 md:px-6 py-5 box-border">
        <p className="text-[var(--text-muted)]">{t("menu.loading")}</p>
        <button
          type="button"
          onClick={loadOrderLink}
          className="mt-2 text-sm text-[var(--accent)] underline"
        >
          {t("menu.retry")}
        </button>
      </div>
    );
  }

  if (error || !linkInfo) {
    return (
      <div className="flex-1 max-w-[430px] md:max-w-4xl mx-auto w-full px-4 md:px-6 py-5 box-border">
        <p className="text-[var(--text-muted)]">{t("menu.menuUnavailable")}</p>
        <button
          type="button"
          onClick={loadOrderLink}
          className="mt-2 text-sm text-[var(--accent)] underline"
        >
          {t("menu.retry")}
        </button>
      </div>
    );
  }

  if (!selectedDate) {
    return (
      <div className="flex-1 max-w-[430px] md:max-w-4xl mx-auto w-full px-4 md:px-6 py-5 box-border">
        <h1 className="text-xl font-semibold text-[var(--text)] m-0 mb-4">
          {t("nav.order")}
        </h1>
        <p className="text-[var(--text-muted)] text-sm mb-4">
          {t("menu.orderChooseDate")}
        </p>
        <button
          type="button"
          onClick={() => setSelectedDate(linkInfo.date)}
          className="w-full inline-flex items-center justify-center font-[var(--font-sans)] text-base font-medium py-3 px-5 rounded-full border-none bg-[var(--accent)] text-[var(--btn-primary-color)] hover:opacity-90 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)] transition-all"
        >
          {linkInfo.label}
        </button>
      </div>
    );
  }

  if (menuLoading) {
    return (
      <div className="flex-1 max-w-[430px] md:max-w-4xl mx-auto w-full px-4 md:px-6 py-5 box-border">
        <p className="text-[var(--text-muted)]">{t("menu.loading")}</p>
        <button
          type="button"
          onClick={backToDateChoice}
          className="mt-2 text-sm text-[var(--accent)] underline"
        >
          {t("menu.backToMenu")}
        </button>
      </div>
    );
  }

  if (!menu?.sections?.length) {
    return (
      <div className="flex-1 max-w-[430px] mx-auto w-full px-4 py-5 box-border">
        <p className="text-[var(--text-muted)]">{t("menu.menuUnavailable")}</p>
        <button
          type="button"
          onClick={backToDateChoice}
          className="mt-2 text-sm text-[var(--accent)] underline"
        >
          {t("menu.backToMenu")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-[430px] md:max-w-4xl mx-auto w-full px-4 md:px-6 py-5 box-border">
      <h1 className="text-xl md:text-2xl font-semibold text-[var(--text)] m-0 mb-4">
        {t("nav.order")} ({selectedDate})
      </h1>

      <button
        type="button"
        onClick={backToDateChoice}
        className="mb-4 text-sm text-[var(--accent)] underline"
      >
        {t("menu.backToMenu")}
      </button>

      <div className="rounded-[var(--radius-md)] border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-[var(--text)] mb-4">
        {t("menu.deadlineWarning")}
      </div>

      {submitSuccess && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" />
          <div className="glass-strong relative rounded-[var(--radius-xl)] px-6 py-5 bon-appetit-popup text-center max-w-[260px] mx-4">
            <img
              src="/face-savoring-food.png"
              alt="bon appetit"
              className="h-16 w-16 object-contain mx-auto mb-2"
            />
            <p className="m-0 text-[var(--text)] font-semibold text-lg">
              {t("menu.bonAppetit")}
            </p>
          </div>
        </div>
      )}

      <form id="order-form" onSubmit={handleSubmit}>
        <div className="space-y-6 md:grid md:grid-cols-2 md:gap-6 md:items-start">
          {menu.sections.map((section) => (
            <div
              key={section.title}
              className="glass-card rounded-[var(--radius-lg)] p-4 animate-glass-rise"
            >
              <h2 className="text-base font-semibold text-[var(--text)] mt-0 mb-3 border-b border-[var(--glass-border)] pb-2">
                {sectionTitle(section.title)}
              </h2>

              <ul className="list-none m-0 p-0 space-y-3">
                {section.items.map((item) => {
                  const displayName = getDishDisplayName(
                    item,
                    locale,
                    translations
                  );
                  const photo = getDishPhoto(item, translations);

                  return (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center gap-2 gap-y-1"
                    >
                      {photo && (
                        <button
                          type="button"
                          onClick={() =>
                            setLightboxPhoto({ url: photo, name: displayName })
                          }
                          className="p-0 border-0 bg-transparent cursor-zoom-in flex-shrink-0"
                          aria-label={displayName}
                        >
                          <img
                            src={photo}
                            alt={displayName}
                            loading="lazy"
                            className="w-11 h-11 object-cover rounded-lg border border-[var(--border)] hover:opacity-85 active:scale-95 transition-all"
                          />
                        </button>
                      )}

                      <div className="flex-1 min-w-0">
                        <span className="text-[var(--text)]">{displayName}</span>
                        {item.weight && (
                          <span className="text-[var(--text-muted)] text-sm ml-1">
                            ({item.weight})
                          </span>
                        )}
                      </div>

                      <span className="text-[var(--text-muted)] text-sm tabular-nums">
                        {item.price.toFixed(2)} €
                      </span>

                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder={t("menu.quantityPlaceholder")}
                        value={quantities[item.id] ?? ""}
                        onChange={(event) =>
                          setQuantity(item.id, event.target.value)
                        }
                        className={inputClass}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div ref={sentinelRef}>
          <TotalBar total={total} submitting={submitting} variant="inline" />
        </div>
      </form>

      <div
        className="fixed bottom-0 left-0 right-0 z-[900] flex justify-center"
        style={{
          opacity: inlineVisible ? 0 : 1,
          transform: inlineVisible ? "translateY(12px)" : "translateY(0)",
          pointerEvents: inlineVisible ? "none" : "auto",
          transition: "opacity 0.2s ease, transform 0.2s ease",
        }}
      >
        <div className="w-full max-w-[430px] md:max-w-4xl mx-auto px-4 md:px-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-4">
          <TotalBar total={total} submitting={submitting} variant="fixed" />
        </div>
      </div>

      <PhotoLightbox
        photo={lightboxPhoto}
        onClose={() => setLightboxPhoto(null)}
      />
    </div>
  );
}
