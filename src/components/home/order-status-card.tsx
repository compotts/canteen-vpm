"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, CheckCircle2, RefreshCw, ShoppingBag } from "lucide-react";
import { LOGOUT_EVENT } from "@/components/auth-provider";
import { ApiError } from "@/lib/api/client";
import { loadCurrentOrder, type CurrentOrder } from "@/lib/valgykla/order-status";

type OrderState =
  | { status: "loading" | "unavailable" | "error" }
  | { status: "ready"; order: CurrentOrder };

export function OrderStatusCard() {
  const t = useTranslations("home.orderStatus");
  const locale = useLocale();
  const [state, setState] = useState<OrderState>({ status: "loading" });
  const requestRef = useRef<AbortController | null>(null);

  const reload = useCallback(() => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;

    const timeout = window.setTimeout(() => {
      if (controller.signal.aborted) return;
      controller.abort();
      setState({ status: "error" });
    }, 15000);

    loadCurrentOrder(locale, controller.signal)
      .then((order) => {
        if (controller.signal.aborted) return;
        setState(order ? { status: "ready", order } : { status: "unavailable" });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.status === 401) {
          window.dispatchEvent(new Event(LOGOUT_EVENT));
        }
        setState({ status: "error" });
      })
      .finally(() => window.clearTimeout(timeout));
  }, [locale]);

  useEffect(() => {
    reload();
    const refresh = () => {
      if (document.visibilityState === "visible") {
        setState({ status: "loading" });
        reload();
      }
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    return () => {
      requestRef.current?.abort();
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
    };
  }, [reload]);

  const order = state.status === "ready" ? state.order : null;
  const hasOrder = Boolean(order?.items.length);
  const href = order ? `/order?date=${encodeURIComponent(order.date)}` : "/order";

  return (
    <section
      className="surface mb-5 overflow-hidden rounded-[var(--radius-lg)] md:mb-6"
      aria-labelledby="home-order-title"
      aria-busy={state.status === "loading"}
    >
      <div className="flex items-start gap-3 p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--hover)] text-[var(--text-muted)]">
          <ShoppingBag className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="home-order-title" className="m-0 text-base font-semibold">
            {t("title")}
          </h2>
          <p className="m-0 mt-1 text-xs text-[var(--text-muted)]">
            {t("source")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setState({ status: "loading" });
            reload();
          }}
          disabled={state.status === "loading"}
          aria-label={t("refresh")}
          title={t("refresh")}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] cursor-pointer hover:bg-[var(--hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${state.status === "loading" ? "animate-spin" : ""}`} aria-hidden="true" />
        </button>
      </div>

      <div className="px-5 pb-5">
        {order ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="m-0 text-sm font-medium capitalize">
                {new Intl.DateTimeFormat(locale, {
                  weekday: "long", day: "numeric", month: "long", year: "numeric",
                }).format(new Date(`${order.date}T12:00:00`))}
              </p>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                hasOrder
                  ? "bg-green-500/10 text-green-700 dark:text-green-400"
                  : "bg-[var(--hover)] text-[var(--text-muted)]"
              }`}>
                {hasOrder && <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}
                {t(hasOrder ? "saved" : "notOrdered")}
              </span>
            </div>
            {hasOrder ? (
              <ul className="m-0 mt-4 max-h-60 list-none space-y-3 overflow-y-auto p-0">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="m-0 text-sm leading-snug break-words">{item.name}</p>
                      <p className="m-0 mt-1 text-xs text-[var(--text-muted)]">
                        {item.quantity} {t("portions")}{item.weight ? ` · ${item.weight}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm tabular-nums">{item.total.toFixed(2)} €</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-0 mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
                {t("emptyHint")}
              </p>
            )}
          </>
        ) : (
          <p role={state.status === "error" ? "alert" : "status"} className="m-0 text-sm leading-relaxed text-[var(--text-muted)]">
            {t(state.status === "loading" ? "loading" : state.status === "unavailable" ? "unavailable" : "error")}
          </p>
        )}
      </div>

      {state.status !== "loading" && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] px-5 py-4">
          {order && hasOrder ? (
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-[var(--text-muted)]">{t("total")}</span>
              <strong className="text-xl font-semibold tabular-nums">{order.total.toFixed(2)} €</strong>
            </div>
          ) : (
            <p className="m-0 max-w-xs text-xs text-[var(--text-muted)]">{t("deadline")}</p>
          )}
          <Link
            href={href}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--btn-primary-color)] no-underline transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-muted)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
          >
            {t(order ? hasOrder ? "edit" : "choose" : "open")}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      )}
    </section>
  );
}
