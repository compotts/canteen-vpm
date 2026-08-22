"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations();
  const size = compact ? "w-[18px] h-[18px]" : "w-5 h-5";

  return (
    <button
      type="button"
      className="flex items-center justify-center p-2 rounded-full cursor-pointer text-[var(--text)] hover:bg-[var(--glass-highlight)] transition-colors"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label={t("nav.theme")}
    >
      <Sun className={`hidden dark:block ${size}`} aria-hidden="true" />
      <Moon className={`block dark:hidden ${size}`} aria-hidden="true" />
    </button>
  );
}
