"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  CalendarRange,
  ChevronDown,
  History as HistoryIcon,
  Loader2,
  Trash2,
} from "lucide-react";
import {
  clearOrderHistory,
  loadOrderHistory,
  removeOrderByMenuDate,
  updateOrderItemQuantity,
} from "@/lib/api/history";
import { localeTags, type Locale } from "@/i18n/config";
import type { OrderItem, OrderRecord } from "@/types/api";

const PER_PAGE = 5;

type PeriodMode = "week" | "month" | "custom";

function formatDate(value: string, localeTag: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  try {
    return new Intl.DateTimeFormat(localeTag, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

function formatQty(quantity: number): string {
  const value = Number(quantity);
  if (!Number.isFinite(value)) return "";
  return value.toFixed(1).replace(/\.0$/, "");
}

function money(value: number | undefined): string {
  return (Number(value) || 0).toFixed(2);
}

function getRange(
  mode: PeriodMode,
  customFrom: string,
  customTo: string
): { from: Date | null; to: Date | null } {
  const now = new Date();

  if (mode === "week") {
    const day = now.getDay() || 7;
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (day - 1));
    return { from: start, to: now };
  }

  if (mode === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    return { from: start, to: now };
  }

  let from: Date | null = null;
  let to: Date | null = null;

  if (customFrom) {
    from = new Date(customFrom);
    from.setHours(0, 0, 0, 0);
  }
  if (customTo) {
    to = new Date(customTo);
    to.setHours(23, 59, 59, 999);
  }

  return { from, to };
}

export function HistoryView() {
  const t = useTranslations();
  const locale = useLocale() as Locale;

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const [mode, setMode] = useState<PeriodMode>("week");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const list = await loadOrderHistory();
      const safeList = Array.isArray(list) ? list : [];
      setOrders(safeList);
      setPage(1);
      setOpenId((previous) =>
        safeList.some((order) => order.id === previous)
          ? previous
          : (safeList[0]?.id ?? null)
      );
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const filteredOrders = useMemo(() => {
    if (!orders.length) return [];

    const { from, to } = getRange(mode, customFrom, customTo);
    if (!from && !to) return orders;

    return orders.filter((order) => {
      const date = new Date(order.createdAt);
      if (Number.isNaN(date.getTime())) return false;
      if (from && date < from) return false;
      if (to && date > to) return false;
      return true;
    });
  }, [orders, mode, customFrom, customTo]);

  const totalForPeriod = useMemo(
    () => filteredOrders.reduce((sum, order) => sum + order.orderTotal, 0),
    [filteredOrders]
  );

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * PER_PAGE;
    return filteredOrders.slice(start, start + PER_PAGE);
  }, [filteredOrders, currentPage]);

  const handleClear = async () => {
    if (!window.confirm(t("history.clearConfirm"))) return;
    await clearOrderHistory();
    await reload();
  };

  const handleDeleteOrder = async (order: OrderRecord) => {
    if (!order.menuDate) return;
    if (!window.confirm(t("history.deleteOrderConfirm"))) return;

    await removeOrderByMenuDate(order.menuDate);
    await reload();
  };

  const changeItemQty = async (
    order: OrderRecord,
    item: OrderItem,
    delta: number
  ) => {
    if (!order.menuDate || item.id == null) return;

    await updateOrderItemQuantity(
      order.menuDate,
      item.id,
      (Number(item.quantity) || 0) + delta
    );
    await reload();
  };

  const removeItem = async (order: OrderRecord, item: OrderItem) => {
    if (!order.menuDate || item.id == null) return;
    await updateOrderItemQuantity(order.menuDate, item.id, 0);
    await reload();
  };

  const selectMode = (next: PeriodMode) => {
    setMode(next);
    setPage(1);
  };

  const periodButtonClass = (active: boolean) =>
    `px-3 py-1.5 text-xs md:text-sm rounded-full font-medium ${
      active
        ? "bg-[var(--accent)] text-[var(--btn-primary-color)]"
        : "text-[var(--text-muted)] hover:bg-[var(--glass-highlight)]"
    }`;

  return (
    <div className="flex-1 max-w-[430px] md:max-w-4xl mx-auto w-full px-4 md:px-6 py-5 box-border">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text)] m-0 mb-4 flex items-center gap-2">
        <HistoryIcon
          className="w-5 h-5 text-[var(--text-muted)]"
          aria-hidden="true"
        />
        {t("nav.history")}
      </h1>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--text-muted)]" />
        </div>
      ) : orders.length === 0 ? (
        <p className="text-[var(--text-muted)] leading-relaxed">
          {t("history.placeholder")} 🙂
        </p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="glass inline-flex items-center gap-1 rounded-full p-1">
              <button
                type="button"
                onClick={() => selectMode("week")}
                className={periodButtonClass(mode === "week")}
              >
                {t("history.periodWeek")}
              </button>

              <button
                type="button"
                onClick={() => selectMode("month")}
                className={periodButtonClass(mode === "month")}
              >
                {t("history.periodMonth")}
              </button>

              <button
                type="button"
                onClick={() => selectMode("custom")}
                className={`${periodButtonClass(
                  mode === "custom"
                )} flex items-center gap-1`}
              >
                <CalendarRange className="w-3.5 h-3.5" aria-hidden="true" />
                {t("history.periodCustom")}
              </button>
            </div>

            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs md:text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/15 active:scale-95 transition-all"
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
                  onChange={(event) => {
                    setCustomFrom(event.target.value);
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
                  onChange={(event) => {
                    setCustomTo(event.target.value);
                    setPage(1);
                  }}
                  className="input rounded-md border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1 text-xs md:text-sm"
                />
              </div>
            </div>
          )}

          <div className="glass-card mb-4 rounded-[var(--radius-lg)] p-4 flex items-baseline justify-between gap-3">
            <div>
              <p className="m-0 text-sm text-[var(--text-muted)]">
                {t("history.summaryTitle")}
              </p>
              <p className="m-0 text-lg font-semibold text-[var(--text)]">
                {money(totalForPeriod)} €
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {paginatedOrders.map((order) => {
              const isOpen = openId === order.id;
              const createdLabel = formatDate(
                order.createdAt,
                localeTags[locale]
              );
              const itemsCount = order.items.reduce(
                (sum, item) => sum + (Number(item.quantity) || 0),
                0
              );

              return (
                <div
                  key={order.id}
                  className="glass-card rounded-[var(--radius-lg)] overflow-hidden"
                >
                  <div className="w-full flex items-center justify-between px-4 py-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : order.id)}
                      className="flex-1 min-w-0 flex items-center justify-between text-left"
                      aria-expanded={isOpen}
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-sm font-medium text-[var(--text)]">
                          {createdLabel}
                          {order.menuDate && (
                            <span className="text-[var(--text-muted)] text-xs ml-1">
                              ({order.menuDate})
                            </span>
                          )}
                        </span>

                        <span className="text-xs text-[var(--text-muted)]">
                          {itemsCount} {t("menu.portions")}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 ml-3">
                        <span className="text-sm font-semibold text-[var(--text)] tabular-nums">
                          {money(order.orderTotal)} €
                        </span>

                        <ChevronDown
                          className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${
                            isOpen ? "rotate-180" : ""
                          }`}
                          aria-hidden="true"
                        />
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteOrder(order)}
                      className="inline-flex shrink-0 items-center justify-center rounded-lg p-2 text-red-500 hover:bg-red-500/10"
                      aria-label={t("history.deleteOrder")}
                      title={t("history.deleteOrder")}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>

                  {isOpen && order.items.length > 0 && (
                    <div className="border-t border-[var(--glass-border)] px-4 py-3 text-sm">
                      <ul className="list-none m-0 p-0 space-y-2">
                        {order.items.map((item) => (
                          <li
                            key={item.id}
                            className="flex items-start justify-between gap-3"
                          >
                            <div className="flex-1 min-w-0">
                              <span className="text-[var(--text)] break-words">
                                {item.name}
                              </span>

                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                                {item.weight && <span>{item.weight}</span>}
                                {item.weight && <span>·</span>}

                                <div className="inline-flex items-center rounded-lg border border-[var(--border)] overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      changeItemQty(order, item, -0.5)
                                    }
                                    className="px-2 py-1 hover:bg-[var(--border-subtle)] transition-colors"
                                    aria-label={t("history.decreaseQty")}
                                  >
                                    −
                                  </button>

                                  <span className="px-2 py-1 min-w-[36px] text-center text-[var(--text)] tabular-nums">
                                    {formatQty(item.quantity)}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      changeItemQty(order, item, 0.5)
                                    }
                                    className="px-2 py-1 hover:bg-[var(--border-subtle)] transition-colors"
                                    aria-label={t("history.increaseQty")}
                                  >
                                    +
                                  </button>
                                </div>

                                <span>× {money(item.pricePerUnit)} €</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-sm font-medium text-[var(--text)] tabular-nums whitespace-nowrap">
                                {money(item.totalPrice)} €
                              </span>

                              <button
                                type="button"
                                onClick={() => removeItem(order, item)}
                                className="inline-flex items-center justify-center rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--glass-highlight)] hover:text-[var(--text)] transition-colors"
                                aria-label={t("history.deleteItem")}
                                title={t("history.deleteItem")}
                              >
                                <Trash2 className="w-4 h-4" aria-hidden="true" />
                              </button>
                            </div>
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
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={currentPage <= 1}
                className="glass px-4 py-2 rounded-full text-xs md:text-sm font-medium text-[var(--text)] disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
              >
                {t("catalog.prev")}
              </button>

              <span className="text-xs md:text-sm text-[var(--text-muted)]">
                {t("catalog.page")} {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                disabled={currentPage >= totalPages}
                className="glass px-4 py-2 rounded-full text-xs md:text-sm font-medium text-[var(--text)] disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
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
