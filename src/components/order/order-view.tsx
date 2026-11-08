"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  UtensilsCrossed,
} from "lucide-react";
import { OrderMenuItem } from "./order-menu-item";
import { OrderSummary } from "./order-summary";
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

function formatOrderDate(date: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${date}T12:00:00`));
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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [inlineVisible, setInlineVisible] = useState(true);
  const [lightboxPhoto, setLightboxPhoto] = useState<LightboxPhoto | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = sentinelRef.current;
    if (!element) return;

    const desktop = window.matchMedia("(min-width: 768px)");
    let observer: IntersectionObserver;
    const observe = () => {
      observer?.disconnect();
      observer = new IntersectionObserver(
        ([entry]) => setInlineVisible(entry.isIntersecting && entry.intersectionRatio >= 1),
        {
          threshold: 1,
          rootMargin: desktop.matches ? "0px" : "0px 0px -88px 0px",
        }
      );
      observer.observe(element);
    };
    observe();
    desktop.addEventListener("change", observe);
    return () => {
      observer.disconnect();
      desktop.removeEventListener("change", observe);
    };
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
    const timeout = setTimeout(() => setSubmitSuccess(false), 4000);
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
    setSubmitError(null);
  };

  const setQuantity = (id: number, value: string) => {
    setQuantities((previous) => ({ ...previous, [id]: value }));
    setSubmitSuccess(false);
    setSubmitError(null);
  };

  const selectedItems = (menu?.sections ?? []).flatMap((section) =>
    section.items.flatMap((item) => {
      const quantity = parseQuantity(quantities[item.id]);
      return quantity > 0
        ? [{
            id: item.id,
            name: getDishDisplayName(item, locale, translations),
            quantity,
            total: item.price * quantity,
          }]
        : [];
    })
  );
  const total = selectedItems.reduce((sum, item) => sum + item.total, 0);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!menu || !selectedDate) return;

    setSubmitting(true);
    setSubmitSuccess(false);
    setSubmitError(null);

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
      try {
        if (historyOrder) await saveOrderToHistory(historyOrder);
        else await removeOrderByMenuDate(selectedDate);
      } catch {
        setSubmitError(t("menu.historySaveError"));
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.dispatchEvent(new Event(LOGOUT_EVENT));
      } else {
        setSubmitError(t("menu.saveError"));
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

  const pageClass = "mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6 md:py-8";

  if (loading || menuLoading) {
    return (
      <div className={pageClass} role="status" aria-label={t("menu.loading")}>
        <div className="mb-8 flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--text-muted)]" aria-hidden="true" />
          <span className="text-sm text-[var(--text-muted)]">{t("menu.loading")}</span>
        </div>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-5 motion-safe:animate-pulse" aria-hidden="true">
            {[0, 1, 2].map((section) => (
              <div key={section} className="surface rounded-[var(--radius-xl)] p-5">
                <div className="mb-6 h-4 w-28 rounded bg-[var(--border)]" />
                {[0, 1].map((item) => (
                  <div key={item} className="mt-5 flex items-center justify-between gap-6">
                    <div className="flex-1 space-y-3">
                      <div className="h-3 w-3/4 rounded bg-[var(--hover)]" />
                      <div className="h-3 w-24 rounded bg-[var(--hover)]" />
                    </div>
                    <div className="h-10 w-32 rounded-lg bg-[var(--hover)]" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !linkInfo || (selectedDate && !menu?.sections.length)) {
    return (
      <div className={pageClass}>
        <div className="surface mx-auto my-8 max-w-md rounded-[var(--radius-xl)] px-6 py-10 text-center">
          <UtensilsCrossed className="mx-auto mb-4 h-8 w-8 text-[var(--text-muted)]" aria-hidden="true" />
          <h1 className="m-0 text-xl font-semibold">{t("menu.menuUnavailable")}</h1>
          <button
            type="button"
            onClick={selectedDate ? () => loadMenuForDate(selectedDate) : loadOrderLink}
            className="mt-6 min-h-11 rounded-full bg-[var(--accent)] px-6 text-sm font-medium text-[var(--btn-primary-color)] cursor-pointer hover:opacity-85"
          >
            {t("menu.retry")}
          </button>
          {selectedDate && (
            <button type="button" onClick={backToDateChoice} className="mx-auto mt-3 block min-h-11 px-4 text-sm text-[var(--text-muted)] cursor-pointer hover:text-[var(--text)]">
              {t("menu.backToMenu")}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!selectedDate || !menu) {
    return (
      <div className={pageClass}>
        <div className="mx-auto max-w-lg py-6 md:py-12">
          <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--border)]">
            <UtensilsCrossed className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="m-0 text-3xl font-semibold tracking-tight">{t("nav.order")}</h1>
          <p className="mb-7 mt-3 text-sm leading-relaxed text-[var(--text-muted)]">{t("menu.orderChooseDate")}</p>
          <button
            type="button"
            onClick={() => setSelectedDate(linkInfo.date)}
            className="surface group flex w-full items-center gap-4 rounded-[var(--radius-xl)] p-5 text-left cursor-pointer transition-colors hover:border-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <CalendarDays className="h-6 w-6 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-[var(--text-muted)]">{t("menu.dailyMenu")}</span>
              <span className="mt-1 block text-base font-semibold capitalize">{formatOrderDate(linkInfo.date, locale)}</span>
            </span>
            <ArrowRight className="h-5 w-5 shrink-0 text-[var(--text-muted)] transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </button>
          <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-[var(--text-muted)]">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {t("menu.deadlineWarning")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={pageClass}>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={backToDateChoice}
            disabled={submitting}
            className="-ml-1 mb-3 inline-flex min-h-9 items-center gap-1.5 rounded-lg px-1 text-xs text-[var(--text-muted)] cursor-pointer hover:text-[var(--text)] disabled:opacity-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {t("menu.changeDate")}
          </button>
          <h1 className="m-0 text-2xl font-semibold tracking-tight md:text-3xl">{t("menu.dailyMenu")}</h1>
          <p className="m-0 mt-2 flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="capitalize">{formatOrderDate(selectedDate, locale)}</span>
          </p>
        </div>
        <div className="flex max-w-xs items-start gap-2 rounded-xl bg-[var(--border-subtle)] px-3 py-2.5 text-xs leading-relaxed text-[var(--text-muted)] md:mt-12">
          <Clock3 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {t("menu.deadlineWarning")}
        </div>
      </div>

      {(submitSuccess || submitError) && (
        <div className="fixed inset-x-4 top-20 z-[1100] mx-auto max-w-md space-y-2">
          {submitSuccess && (
            <div
              role="status"
              className="surface-raised animate-pop flex items-center gap-3 rounded-2xl px-4 py-4"
            >
              <CheckCircle2
                className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400"
                aria-hidden="true"
              />
              <p className="m-0 text-sm">
                {t("menu.orderSuccess")}. {t("menu.bonAppetit")}
              </p>
            </div>
          )}
          {submitError && (
            <div
              role="alert"
              className="surface-raised rounded-2xl border-amber-500/40 px-4 py-4"
            >
              <p className="m-0 text-sm leading-relaxed">{submitError}</p>
              <button
                type="button"
                onClick={() => setSubmitError(null)}
                className="mt-2 min-h-9 rounded-lg px-2 text-sm font-medium cursor-pointer hover:bg-[var(--hover)]"
              >
                {t("menu.ok")}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8">
        <div className="min-w-0">
          <nav
            className="mb-5 flex gap-2 overflow-x-auto pb-1 no-scrollbar"
            aria-label={t("menu.categories")}
          >
            {menu.sections.map((section, index) => (
              <a
                key={`${section.title}-${index}`}
                href={`#order-section-${index}`}
                className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] no-underline transition-colors hover:border-[var(--text-muted)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]"
              >
                {sectionTitle(section.title)}
              </a>
            ))}
          </nav>

          <form id="order-form" onSubmit={handleSubmit}>
            <fieldset
              disabled={submitting}
              className="m-0 min-w-0 space-y-5 border-0 p-0 disabled:opacity-60"
            >
              <legend className="sr-only">{t("menu.dailyMenu")}</legend>
              {menu.sections.map((section, index) => (
                <section
                  key={`${section.title}-${index}`}
                  id={`order-section-${index}`}
                  className="surface scroll-mt-24 overflow-hidden rounded-[var(--radius-xl)]"
                  aria-labelledby={`order-heading-${index}`}
                >
                  <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-4 sm:px-5">
                    <h2
                      id={`order-heading-${index}`}
                      className="m-0 text-base font-semibold tracking-tight"
                    >
                      {sectionTitle(section.title)}
                    </h2>
                    <span className="text-xs tabular-nums text-[var(--text-muted)]">
                      {section.items.length}
                    </span>
                  </div>
                  <ul className="m-0 list-none divide-y divide-[var(--border)] p-0">
                    {section.items.map((item) => {
                      const name = getDishDisplayName(item, locale, translations);
                      const photo = getDishPhoto(item, translations);
                      return (
                        <OrderMenuItem
                          key={item.id}
                          item={item}
                          name={name}
                          photo={photo}
                          value={quantities[item.id] ?? ""}
                          onChange={(value) => setQuantity(item.id, value)}
                          onPhotoClick={() =>
                            photo && setLightboxPhoto({ url: photo, name })
                          }
                        />
                      );
                    })}
                  </ul>
                </section>
              ))}
            </fieldset>
          </form>
        </div>

        <div className="lg:sticky lg:top-24">
          <OrderSummary
            items={selectedItems}
            total={total}
            submitting={submitting}
            actionRef={sentinelRef}
          />
        </div>
      </div>

      <div
        className="fixed inset-x-0 bottom-0 z-[900] px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-4 lg:hidden"
        style={{
          visibility: inlineVisible ? "hidden" : "visible",
          opacity: inlineVisible ? 0 : 1,
          pointerEvents: inlineVisible ? "none" : "auto",
        }}
        inert={inlineVisible}
      >
        <div className="surface-raised mx-auto flex max-w-2xl items-center justify-between gap-4 rounded-2xl px-4 py-3">
          <div className="min-w-0">
            <p className="m-0 text-xs text-[var(--text-muted)]">{t("menu.total")}</p>
            <strong className="text-xl font-semibold tracking-tight tabular-nums">{total.toFixed(2)} €</strong>
          </div>
          <button
            form="order-form"
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-0 bg-[var(--accent)] px-6 text-sm font-semibold text-[var(--btn-primary-color)] cursor-pointer hover:opacity-85 disabled:opacity-50 disabled:cursor-wait"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {submitting ? t("menu.submitting") : t("menu.submit")}
          </button>
        </div>
      </div>

      <PhotoLightbox
        photo={lightboxPhoto}
        onClose={() => setLightboxPhoto(null)}
      />
    </div>
  );
}
