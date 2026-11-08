"use client";

import { Check, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MenuItem } from "@/lib/valgykla/types";

export function OrderMenuItem({
  item,
  name,
  photo,
  value,
  onChange,
  onPhotoClick,
}: {
  item: MenuItem;
  name: string;
  photo: string | null;
  value: string;
  onChange: (value: string) => void;
  onPhotoClick: () => void;
}) {
  const t = useTranslations("menu");
  const quantity = Number(value.replace(",", "."));
  const selected = Number.isFinite(quantity) && quantity > 0;

  return (
    <li
      className={`grid gap-3 p-4 transition-colors sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-5 sm:px-5 sm:py-5 ${
        selected ? "bg-[var(--hover)]" : ""
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        {photo && (
          <button
            type="button"
            onClick={onPhotoClick}
            aria-label={name}
            className="shrink-0 overflow-hidden rounded-xl border border-[var(--border)] p-0 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <img
              src={photo}
              alt={name}
              loading="lazy"
              className="h-14 w-14 object-cover transition-opacity hover:opacity-85"
            />
          </button>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <h3 className="m-0 text-[15px] leading-snug font-medium text-[var(--text)] [overflow-wrap:anywhere]">
              {name}
            </h3>
            {selected && (
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--text-muted)]">
            {item.weight && (
              <>
                <span>{item.weight}</span>
                <span aria-hidden="true">·</span>
              </>
            )}
            <span className="tabular-nums">
              {item.price.toFixed(2)} € / {t("portions")}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 sm:block">
        <span className="hidden text-xs text-[var(--text-muted)] min-[400px]:inline sm:hidden">
          {t("quantityLabel")}
        </span>
        <div className="flex shrink-0 items-center gap-1" role="group" aria-label={`${name}, ${t("quantityLabel")}`}>
          <div className="flex rounded-lg bg-[var(--border-subtle)] p-0.5">
            {["0.5", "1", "2"].map((preset) => (
              <button
                key={preset}
                type="button"
                aria-label={t("setQuantity", { quantity: preset })}
                aria-pressed={quantity === Number(preset)}
                onClick={() => onChange(preset)}
                className={`h-10 w-9 rounded-md border-0 text-sm font-medium tabular-nums cursor-pointer transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)] ${
                  quantity === Number(preset)
                    ? "bg-[var(--accent)] text-[var(--btn-primary-color)]"
                    : "bg-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          <input
            type="text"
            inputMode="decimal"
            aria-label={`${name}, ${t("quantityLabel")}`}
            placeholder={t("quantityPlaceholder")}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="h-11 w-12 min-w-0 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-1 text-center text-base tabular-nums text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />

          <button
            type="button"
            aria-label={`${name}, ${t("clearQuantity")}`}
            title={t("clearQuantity")}
            onClick={() => onChange("")}
            disabled={!value}
            className="inline-flex h-11 w-8 shrink-0 items-center justify-center rounded-lg border-0 bg-transparent text-[var(--text-muted)] cursor-pointer transition-colors hover:bg-[var(--border-subtle)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-25 disabled:cursor-default"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </li>
  );
}
