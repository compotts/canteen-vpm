import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { History as HistoryIcon, ChevronDown, CalendarRange, Trash2 } from "lucide-react";
import { loadOrderHistory, clearOrderHistory } from "../services/history.js";

const PER_PAGE = 5;

function formatDate(value, locale) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

export default function History() {
  const { t, i18n } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState(null);
  const [mode, setMode] = useState("week");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  useEffect(() => {
    const list = loadOrderHistory();
    setOrders(list);
    setPage(1);
    setOpenId(list[0]?.id ?? null);
  }, []);

  const filteredOrders = useMemo(() => {
    if (!orders.length) return [];
    const now = new Date();

    let from = null;
    let to = null;

    if (mode === "week") {
      const day = now.getDay() || 7;
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - (day - 1));
      from = start;
      to = now;
    } else if (mode === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      from = start;
      to = now;
    } else if (mode === "custom") {
      if (customFrom) {
        from = new Date(customFrom);
        from.setHours(0, 0, 0, 0);
      }
      if (customTo) {
        const end = new Date(customTo);
        end.setHours(23, 59, 59, 999);
        to = end;
      }
    }

    if (!from && !to) return orders;

    return orders.filter((order) => {
      if (!order || !order.createdAt) return false;
      const d = new Date(order.createdAt);
      if (Number.isNaN(d.getTime())) return false;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [orders, mode, customFrom, customTo]);

  const totalForPeriod = useMemo(
    () =>
      filteredOrders.reduce(
        (sum, order) =>
          sum + (typeof order.orderTotal === "number" ? order.orderTotal : 0),
        0,
      ),
    [filteredOrders],
  );

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * PER_PAGE;
    return filteredOrders.slice(start, start + PER_PAGE);
  }, [filteredOrders, currentPage]);

  const handleClear = () => {
    const confirmed = window.confirm(
      t("history.clearConfirm") ||
        t("history.clearConfirm"),
    );
    if (!confirmed) return;
    clearOrderHistory();
    setOrders([]);
    setPage(1);
    setOpenId(null);
  };

  return (
    <div className="flex-1 max-w-[430px] md:max-w-4xl mx-auto w-full px-4 md:px-6 py-5 box-border pb-24">
      <h1 className="text-xl md:text-2xl font-semibold text-[var(--text)] m-0 mb-3 flex items-center gap-2">
        <HistoryIcon className="w-5 h-5 text-[var(--text-muted)]" aria-hidden="true" />
        {t("nav.history")}
      </h1>

      {orders.length === 0 ? (
        <p className="text-[var(--text-muted)] leading-relaxed">
          {t("history.placeholder")} 🙂
        </p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-1 rounded-full bg-[var(--surface)] border border-[var(--border)] p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("week");
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs md:text-sm rounded-full font-medium ${
                  mode === "week"
                    ? "bg-[var(--accent)] text-[var(--btn-primary-color)]"
                    : "text-[var(--text-muted)] hover:bg-[var(--border-subtle)]"
                }`}
              >
                {t("history.periodWeek")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("month");
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs md:text-sm rounded-full font-medium ${
                  mode === "month"
                    ? "bg-[var(--accent)] text-[var(--btn-primary-color)]"
                    : "text-[var(--text-muted)] hover:bg-[var(--border-subtle)]"
                }`}
              >
                {t("history.periodMonth")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("custom");
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs md:text-sm rounded-full font-medium flex items-center gap-1 ${
                  mode === "custom"
                    ? "bg-[var(--accent)] text-[var(--btn-primary-color)]"
                    : "text-[var(--text-muted)] hover:bg-[var(--border-subtle)]"
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5" aria-hidden="true" />
                {t("history.periodCustom")}
              </button>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/15"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              {t("history.clear")}
            </button>
          </div>

          {mode === "custom" && (
            <div className="mb-3 flex flex-wrap items-center gap-3 text-xs md:text-sm text-[var(--text-muted)]">
              <div className="flex items-center gap-1">
                <span>{t("history.from")}</span>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => {
                    setCustomFrom(e.target.value);
                    setPage(1);
                  }}
                  className="input rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1 text-xs md:text-sm"
                />
              </div>
              <div className="flex items-center gap-1">
                <span>{t("history.to")}</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => {
                    setCustomTo(e.target.value);
                    setPage(1);
                  }}
                  className="input rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1 text-xs md:text-sm"
                />
              </div>
            </div>
          )}

          <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 flex items-baseline justify-between gap-3">
            <div>
              <p className="m-0 text-sm text-[var(--text-muted)]">
                {t("history.summaryTitle")}
              </p>
              <p className="m-0 text-lg font-semibold text-[var(--text)]">
                {totalForPeriod.toFixed(2)} €
              </p>
            </div>
            <p className="m-0 text-xs text-[var(--text-muted)] max-w-[220px] text-right">
              {t("history.summaryHint")}
            </p>
          </div>

          <div className="space-y-3">
            {paginatedOrders.map((order) => {
              const isOpen = openId === order.id;
              const createdLabel = formatDate(order.createdAt, i18n.language || "ru-RU");
              const menuDateLabel = order.menuDate || "";
              const itemsCount = Array.isArray(order.items) ? order.items.length : 0;

              return (
                <div
                  key={order.id}
                  className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-sm)] overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : order.id)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-[var(--text)]">
                        {createdLabel}
                        {menuDateLabel && (
                          <span className="text-[var(--text-muted)] text-xs ml-1">
                            ({menuDateLabel})
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {itemsCount} {t("menu.portions")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-[var(--text)] tabular-nums">
                        {typeof order.orderTotal === "number" ? order.orderTotal.toFixed(2) : "0.00"} €
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${isOpen ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    </div>
                  </button>

                  {isOpen && Array.isArray(order.items) && order.items.length > 0 && (
                    <div className="border-t border-[var(--border)] px-4 py-3 text-sm">
                      <ul className="list-none m-0 p-0 space-y-2">
                        {order.items.map((item) => (
                          <li key={item.id} className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <span className="text-[var(--text)] break-words">
                                {item.name}
                              </span>
                              <div className="text-xs text-[var(--text-muted)]">
                                {item.weight && <span>{item.weight}</span>}
                                {item.weight && " · "}
                                <span>
                                  {item.quantity}×{" "}
                                  {typeof item.pricePerUnit === "number"
                                    ? item.pricePerUnit.toFixed(2)
                                    : "0.00"}{" "}
                                  €
                                </span>
                              </div>
                            </div>
                            <span className="text-sm font-medium text-[var(--text)] tabular-nums whitespace-nowrap">
                              {typeof item.totalPrice === "number"
                                ? item.totalPrice.toFixed(2)
                                : "0.00"}{" "}
                              €
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-6 pb-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium bg-[var(--border-subtle)] text-[var(--text)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("catalog.prev")}
              </button>
              <span className="text-xs md:text-sm text-[var(--text-muted)]">
                {t("catalog.page")} {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium bg-[var(--border-subtle)] text-[var(--text)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("catalog.next")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}