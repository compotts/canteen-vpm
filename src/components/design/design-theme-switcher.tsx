"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Moon, Sun } from "lucide-react";
import { getColorTheme, getThemeName, isDarkTheme } from "@/lib/themes";

export function DesignThemeSwitcher() {
  const t = useTranslations("design.theme");
  const { resolvedTheme, setTheme } = useTheme();
  const dark = isDarkTheme(resolvedTheme);

  return (
    <fieldset className="design-theme-picker">
      <legend>{t("title")}</legend>
      <div>
        {[false, true].map((value) => {
          const Icon = value ? Moon : Sun;
          return (
            <button
              type="button"
              key={String(value)}
              aria-pressed={dark === value}
              onClick={() =>
                setTheme(getThemeName(getColorTheme(resolvedTheme), value))
              }
            >
              <Icon size={18} aria-hidden="true" />
              {t(value ? "dark" : "light")}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
