"use client";

import { Loader2, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Ref } from "react";

export type SelectedOrderItem = {
  id: number;
  name: string;
  quantity: number;
  total: number;
};

export function OrderSummary({
  items,
  total,
  submitting,
  actionRef,
}: {
  items: SelectedOrderItem[];
  total: number;
  submitting: boolean;
  actionRef: Ref<HTMLDivElement>;
}) {
  const t = useTranslations("menu");

  return (
    <section className="surface overflow-hidden rounded-[var(--radius-xl)]" aria-label={t("yourOrder")}>
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
        <h2 className="m-0 text-base font-semibold">{t("yourOrder")}</h2>
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--hover)] px-1.5 text-xs font-medium tabular-nums text-[var(--text-muted)]">
          {items.length}
        </span>
      </div>

      {items.length ? (
        <ul className="m-0 max-h-[40vh] list-none space-y-4 overflow-y-auto p-5">
          {items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="m-0 text-sm leading-snug [overflow-wrap:anywhere]">{item.name}</p>
                <p className="m-0 mt-1 text-xs text-[var(--text-muted)]">
                  {item.quantity} {t("portions")}
                </p>
              </div>
              <span className="shrink-0 text-sm font-medium tabular-nums">{item.total.toFixed(2)} €</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-6 py-8 text-center">
          <ShoppingBag className="mx-auto mb-3 h-7 w-7 text-[var(--text-muted)]" aria-hidden="true" />
          <p className="m-0 text-sm font-medium">{t("emptyOrder")}</p>
          <p className="m-0 mt-1.5 text-xs leading-relaxed text-[var(--text-muted)]">{t("emptyOrderHint")}</p>
        </div>
      )}

      <div ref={actionRef} className="border-t border-[var(--border)] p-5">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <span className="text-sm text-[var(--text-muted)]">{t("total")}</span>
          <strong className="text-2xl font-semibold tracking-tight tabular-nums">{total.toFixed(2)} €</strong>
        </div>
        <button
          form="order-form"
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-0 bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--btn-primary-color)] cursor-pointer transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-muted)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] disabled:opacity-50 disabled:cursor-wait"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {submitting ? t("submitting") : t("submit")}
        </button>
      </div>
    </section>
  );
}
