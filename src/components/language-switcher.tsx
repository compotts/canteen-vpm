"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { setUserLocale } from "@/i18n/locale";
import { locales, localeLabels, type Locale } from "@/i18n/config";

const STYLES = {
  desktop: {
    base: "px-2.5 py-1.5 text-sm font-medium border-none rounded-full cursor-pointer transition-colors",
    active: "bg-[var(--accent)] text-[var(--btn-primary-color)]",
    idle: "bg-transparent text-[var(--text-muted)] hover:bg-[var(--glass-highlight)] hover:text-[var(--text)]",
    wrapper: "flex items-center gap-2",
  },
  mobile: {
    base: "px-2 py-1 text-xs font-semibold border-none rounded-full cursor-pointer transition-colors",
    active: "bg-[var(--accent)] text-[var(--btn-primary-color)]",
    idle: "bg-transparent text-[var(--text-muted)]",
    wrapper: "flex items-center gap-0.5",
  },
} as const;

export function LanguageSwitcher({
  variant = "desktop",
}: {
  variant?: keyof typeof STYLES;
}) {
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const styles = STYLES[variant];

  const select = (next: Locale) => {
    if (next === locale) return;
    startTransition(async () => {
      await setUserLocale(next);
      router.refresh();
    });
  };

  return (
    <div className={styles.wrapper}>
      {locales.map((code) => (
        <button
          key={code}
          type="button"
          disabled={pending}
          onClick={() => select(code)}
          className={`${styles.base} ${
            locale === code ? styles.active : styles.idle
          }`}
        >
          {localeLabels[code]}
        </button>
      ))}
    </div>
  );
}
