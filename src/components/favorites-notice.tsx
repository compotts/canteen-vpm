"use client";

import { useTranslations } from "next-intl";
import { useFavorites } from "./favorites-provider";

export function FavoritesNotice() {
  const t = useTranslations("favorites");
  const { loading, error, reload } = useFavorites();
  if (loading) return <p role="status" className="mb-4 text-xs text-[var(--text-muted)]">{t("loading")}</p>;
  if (!error) return null;
  return (
    <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-500/25 bg-red-500/5 px-3 py-2 text-sm">
      <span>{t(error === "load" ? "loadError" : "saveError")}</span>
      <button type="button" onClick={reload} className="min-h-11 text-xs font-medium text-[var(--accent)]">{t("reload")}</button>
    </div>
  );
}
