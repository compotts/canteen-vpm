import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  getOrderMakePage,
  parseOrderMakeLink,
  getOrderPage,
  parseMenuFromHtml,
  submitOrder,
} from "../services/valgykla.js";
import { SECTION_TITLE_KEYS } from "../constants.js";
import { useLanguage } from "../hooks/useLanguage.js";
import { nameToRuMap, normalizeDishName } from "../data/catalog.js";
import { saveOrderToHistory, removeOrderFromHistoryByMenuDate } from "../services/history.js";

function getSectionDisplayTitle(title, t) {
  if (!title || typeof title !== "string") return title || "";
  const key = SECTION_TITLE_KEYS[title.trim().toLowerCase()];
  return key ? t(key) : title;
}

function getDishDisplayName(item, lang) {
  const rawName = item.name || "";
  const key = normalizeDishName(rawName);
  if (lang === "ru") {
    return nameToRuMap[key] || rawName.trim();
  }
  return rawName.trim();
}

function buildHistoryOrder(menu, quantities, lang, selectedDate) {
  if (!menu || !menu.sections?.length) return null;
  const items = [];

  menu.sections.forEach((section) => {
    section.items.forEach((item) => {
      const rawQ = quantities[item.id];
      const n = rawQ === "" || rawQ == null ? 0 : parseFloat(String(rawQ).replace(",", ".")) || 0;
      if (!n || n <= 0) return;
      const pricePerUnit = typeof item.price === "number" ? item.price : 0;
      const totalPrice = pricePerUnit * n;
      items.push({
        id: item.id,
        name: getDishDisplayName(item, lang),
        weight: item.weight || "",
        quantity: n,
        pricePerUnit,
        totalPrice,
      });
    });
  });

  if (!items.length) return null;

  const orderTotal = items.reduce(
    (sum, i) => sum + (typeof i.totalPrice === "number" ? i.totalPrice : 0),
    0
  );

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    menuDate: selectedDate || null,
    items,
    orderTotal,
  };
}

function TotalBar({ total, submitLoading, t, variant }) {
  const isFixed = variant === "fixed";
  return (
    <div
      className={
        isFixed
          ? "flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 px-5 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.18)]"
          : "flex items-center justify-between gap-4 mt-4 md:mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3.5 shadow-[var(--shadow-sm)]"
      }
      style={
        isFixed
          ? { backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }
          : undefined
      }
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
        disabled={submitLoading}
        className="inline-flex items-center justify-center font-[var(--font-sans)] text-base font-semibold py-2.5 px-6 rounded-xl border-none cursor-pointer bg-[var(--accent)] text-[var(--btn-primary-color)] disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-95 transition-all"
      >
        {submitLoading ? t("menu.submitting") : t("menu.submit")}
      </button>
    </div>
  );
}

export default function Order() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const [linkInfo, setLinkInfo] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [menu, setMenu] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [menuLoading, setMenuLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [inlineVisible, setInlineVisible] = useState(true);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInlineVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [menu]);

  const loadOrderLink = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const html = await getOrderMakePage();
      const parsed = parseOrderMakeLink(html);
      setLinkInfo(parsed);
    } catch (err) {
      if (err?.status === 401) window.dispatchEvent(new Event("auth:logout"));
      else setError(true);
      setLinkInfo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrderLink();
  }, [loadOrderLink]);

  useEffect(() => {
    if (!submitSuccess) return;
    const timeout = setTimeout(() => setSubmitSuccess(false), 2200);
    return () => clearTimeout(timeout);
  }, [submitSuccess]);

  const loadMenuForDate = useCallback(async (date) => {
    setMenuLoading(true);
    setMenu(null);
    try {
      const html = await getOrderPage(date);
      const parsed = parseMenuFromHtml(html, date);
      setMenu(parsed);
      const initial = {};
      parsed.sections.forEach((sec) => {
        sec.items.forEach((item) => {
          const v = (item.initialQuantity ?? "").trim();
          initial[item.id] = v === "" ? "" : v.replace(",", ".");
        });
      });
      setQuantities(initial);
      setSubmitSuccess(false);
    } catch (err) {
      if (err?.status === 401) window.dispatchEvent(new Event("auth:logout"));
      else setMenu(null);
    } finally {
      setMenuLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDate) loadMenuForDate(selectedDate);
  }, [selectedDate, loadMenuForDate]);

  const openOrderForm = () => {
    if (linkInfo?.date) setSelectedDate(linkInfo.date);
  };

  const backToDateChoice = () => {
    setSelectedDate(null);
    setMenu(null);
    setSubmitSuccess(false);
  };

  const setQuantity = (id, value) => {
    setQuantities((prev) => ({ ...prev, [id]: value }));
    setSubmitSuccess(false);
  };

  const total = menu
    ? menu.sections.reduce((sum, sec) => {
      return (
        sum +
        sec.items.reduce((s, item) => {
          const q = quantities[item.id];
          const n =
            q === "" || q == null
              ? 0
              : parseFloat(String(q).replace(",", ".")) || 0;
          return s + item.price * n;
        }, 0)
      );
    }, 0)
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!menu || !selectedDate) return;
    setSubmitLoading(true);
    setSubmitSuccess(false);
    try {
      const payload = {};
      menu.sections.forEach((sec) => {
        sec.items.forEach((item) => {
          const v = quantities[item.id];
          payload[item.id] = v === "" || v == null ? "" : String(v).replace(",", ".");
        });
      });
      await submitOrder(selectedDate, payload);
      const historyOrder = buildHistoryOrder(menu, quantities, lang, selectedDate);
      if (historyOrder) {
        await saveOrderToHistory(historyOrder);
      } else {
        await removeOrderFromHistoryByMenuDate(selectedDate);
      }
      setSubmitSuccess(true);
    } catch (err) {
      if (err?.status === 401) window.dispatchEvent(new Event("auth:logout"));
    } finally {
      setSubmitLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-base text-right text-[var(--text)] max-w-[80px] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--text-muted)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]";

  if (loading) {
    return (
      <div className="flex-1 max-w-[430px] md:max-w-4xl mx-auto w-full px-4 md:px-6 py-5 box-border">
        <p className="text-[var(--text-muted)]">{t("menu.loading")}</p>
        <button type="button" onClick={loadOrderLink} className="mt-2 text-sm text-[var(--accent)] underline">
          {t("menu.retry")}
        </button>
      </div>
    );
  }

  if (error || !linkInfo) {
    return (
      <div className="flex-1 max-w-[430px] md:max-w-4xl mx-auto w-full px-4 md:px-6 py-5 box-border">
        <p className="text-[var(--text-muted)]">{t("menu.menuUnavailable")}</p>
        <button type="button" onClick={loadOrderLink} className="mt-2 text-sm text-[var(--accent)] underline">
          {t("menu.retry")}
        </button>
      </div>
    );
  }

  if (!selectedDate) {
    return (
      <div className="flex-1 max-w-[430px] md:max-w-4xl mx-auto w-full px-4 md:px-6 py-5 box-border">
        <h1 className="text-xl font-semibold text-[var(--text)] m-0 mb-4">{t("nav.order")}</h1>
        <p className="text-[var(--text-muted)] text-sm mb-4">{t("menu.orderChooseDate")}</p>
        <button
          type="button"
          onClick={openOrderForm}
          className="w-full inline-flex items-center justify-center font-[var(--font-sans)] text-base font-medium py-3 px-5 rounded-xl border-2 border-[var(--accent)] bg-[var(--accent)] text-[var(--btn-primary-color)] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)] transition-opacity"
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
        <button type="button" onClick={backToDateChoice} className="mt-2 text-sm text-[var(--accent)] underline">
          {t("menu.backToMenu")}
        </button>
      </div>
    );
  }

  if (!menu?.sections?.length) {
    return (
      <div className="flex-1 max-w-[430px] mx-auto w-full px-4 py-5 box-border">
        <p className="text-[var(--text-muted)]">{t("menu.menuUnavailable")}</p>
        <button type="button" onClick={backToDateChoice} className="mt-2 text-sm text-[var(--accent)] underline">
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

      <button type="button" onClick={backToDateChoice} className="mb-4 text-sm text-[var(--accent)] underline">
        {t("menu.backToMenu")}
      </button>

      {menu && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-[var(--text)] mb-4">
          {t("menu.deadlineWarning")}
        </div>
      )}

      {submitSuccess && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-6 py-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] bon-appetit-popup text-center max-w-[260px] mx-4">
            <div className="text-4xl mb-2" aria-hidden="true">😋</div>
            <p className="m-0 text-[var(--text)] font-semibold text-lg">{t("menu.bonAppetit")}</p>
          </div>
        </div>
      )}

      <form id="order-form" onSubmit={handleSubmit}>
        <div className="space-y-6 md:grid md:grid-cols-2 md:gap-6 md:items-start">
          {menu.sections.map((section) => (
            <div
              key={section.title}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-[var(--shadow-sm)]"
            >
              <h2 className="text-base font-semibold text-[var(--text)] mt-0 mb-3 border-b border-[var(--border)] pb-2">
                {getSectionDisplayTitle(section.title, t)}
              </h2>
              <ul className="list-none m-0 p-0 space-y-3">
                {section.items.map((item) => {
                  const displayName = getDishDisplayName(item, lang);
                  return (
                    <li key={item.id} className="flex flex-wrap items-center gap-2 gap-y-1">
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
                        onChange={(e) => setQuantity(item.id, e.target.value)}
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
          <TotalBar total={total} submitLoading={submitLoading} t={t} variant="inline" />
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
        <div className="w-full max-w-[430px] md:max-w-4xl mx-auto px-4 md:px-6 pb-4">
          <TotalBar total={total} submitLoading={submitLoading} t={t} variant="fixed" />
        </div>
      </div>
    </div>
  );
}