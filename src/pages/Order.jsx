import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  getOrderMakePage,
  parseOrderMakeLink,
  getOrderPage,
  parseMenuFromHtml,
  submitOrder,
} from "../services/valgykla.js";

export default function Order() {
  const { t } = useTranslation();
  const [linkInfo, setLinkInfo] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [menu, setMenu] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [menuLoading, setMenuLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState(false);

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

  const total = menu ? menu.sections.reduce((sum, sec) => {
    return sum + sec.items.reduce((s, item) => {
      const q = quantities[item.id];
      const n = q === "" || q == null ? 0 : parseFloat(String(q).replace(",", ".")) || 0;
      return s + item.price * n;
    }, 0);
  }, 0) : 0;

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
      <div className="flex-1 max-w-[430px] mx-auto w-full px-4 py-5 box-border">
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
      <div className="flex-1 max-w-[430px] mx-auto w-full px-4 py-5 box-border">
        <p className="text-[var(--text-muted)]">{t("menu.menuUnavailable")}</p>
        <button type="button" onClick={loadOrderLink} className="mt-2 text-sm text-[var(--accent)] underline">
          {t("menu.retry")}
        </button>
      </div>
    );
  }

  if (!selectedDate) {
    return (
      <div className="flex-1 max-w-[430px] mx-auto w-full px-4 py-5 box-border">
        <h1 className="text-xl font-semibold text-[var(--text)] m-0 mb-4">
          {t("nav.order")}
        </h1>
        <p className="text-[var(--text-muted)] text-sm mb-4">
          {t("menu.orderChooseDate")}
        </p>
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
      <div className="flex-1 max-w-[430px] mx-auto w-full px-4 py-5 box-border">
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
        <button type="button" onClick={backToDateChoice} className="mt-2 text-sm text-[var(--accent)] underline">
          {t("menu.backToMenu")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-[430px] mx-auto w-full px-4 py-5 box-border">
      <h1 className="text-xl font-semibold text-[var(--text)] m-0 mb-4">
        {t("nav.order")} ({selectedDate})
      </h1>

      <button
        type="button"
        onClick={backToDateChoice}
        className="mb-4 text-sm text-[var(--accent)] underline"
      >
        {t("menu.backToMenu")}
      </button>

      {menu && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-[var(--text)] mb-4">
          {t("menu.deadlineWarning")}
        </div>
      )}

      {submitSuccess && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-300 mb-4">
          {t("menu.orderSuccess")}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {menu.sections.map((section) => (
            <div key={section.title} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-[var(--shadow-sm)]">
              <h2 className="text-base font-semibold text-[var(--text)] mt-0 mb-3 border-b border-[var(--border)] pb-2">
                {section.title}
              </h2>
              <ul className="list-none m-0 p-0 space-y-3">
                {section.items.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center gap-2 gap-y-1">
                    <div className="flex-1 min-w-0">
                      <span className="text-[var(--text)]">{item.name}</span>
                      {item.weight && (
                        <span className="text-[var(--text-muted)] text-sm ml-1">({item.weight})</span>
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
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
          <strong className="text-[var(--text)]">
            {t("menu.total")}: {total.toFixed(2)} €
          </strong>
          <button
            type="submit"
            disabled={submitLoading}
            className="inline-flex items-center justify-center font-[var(--font-sans)] text-base font-medium py-2.5 px-5 rounded-lg border-none cursor-pointer bg-[var(--accent)] text-[var(--btn-primary-color)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitLoading ? t("menu.submitting") : t("menu.submit")}
          </button>
        </div>
      </form>
    </div>
  );
}
