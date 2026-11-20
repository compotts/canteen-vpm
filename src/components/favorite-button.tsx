"use client";

import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { favoriteKey } from "@/lib/favorites";
import { useFavorites } from "./favorites-provider";

export function FavoriteButton({ name, displayName }: { name: string; displayName: string }) {
  const t = useTranslations("favorites");
  const favorites = useFavorites();
  const key = favoriteKey(name);
  const selected = favorites.keys.has(key);
  const pending = favorites.pending.has(key);
  const label = t(selected ? "remove" : "add", { name: displayName });

  return (
    <button
      type="button"
      onClick={() => favorites.toggle(name)}
      disabled={!favorites.ready || pending || !key}
      aria-label={label}
      title={label}
      aria-pressed={selected}
      aria-busy={pending}
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-0 bg-transparent cursor-pointer transition-colors hover:bg-rose-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50 disabled:cursor-default ${
        selected ? "text-rose-600 dark:text-rose-400" : "text-[var(--text-muted)]"
      }`}
    >
      <Heart className="h-5 w-5" fill={selected ? "currentColor" : "none"} aria-hidden="true" />
    </button>
  );
}
