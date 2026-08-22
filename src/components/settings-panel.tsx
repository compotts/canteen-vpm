"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { LogOut, Moon, Sun, X } from "lucide-react";
import { LanguageSwitcher } from "./language-switcher";
import { useAuth } from "./auth-provider";

function Row({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <p className="m-0 text-sm font-medium text-[var(--text)]">{title}</p>
      {children}
    </div>
  );
}

const TAPS_TO_OPEN_ADMIN = 5;
const TAP_WINDOW_MS = 3000;

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const t = useTranslations();
  const router = useRouter();
  const { logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const taps = useRef({ count: 0, last: 0 });

  const handleTitleTap = () => {
    const now = Date.now();
    const state = taps.current;

    state.count = now - state.last > TAP_WINDOW_MS ? 1 : state.count + 1;
    state.last = now;

    if (state.count >= TAPS_TO_OPEN_ADMIN) {
      state.count = 0;
      onClose();
      router.push("/admin");
    }
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const themeButtonClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
      active
        ? "bg-[var(--accent)] text-[var(--btn-primary-color)]"
        : "bg-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text)]"
    }`;

  return createPortal(
    <div
      className="animate-fade fixed inset-0 z-[1200] flex items-end md:items-center justify-center bg-black/50 p-0 md:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick={(event) => event.stopPropagation()}
        className="surface-raised w-full md:max-w-md rounded-t-[var(--radius-xl)] md:rounded-[var(--radius-xl)] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:pb-5 animate-sheet"
      >
        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 id="settings-title" className="m-0">
            <button
              type="button"
              onClick={handleTitleTap}
              className="text-lg font-semibold text-[var(--text)] bg-transparent border-0 p-0 cursor-default select-none"
            >
              {t("settings.title")}
            </button>
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="p-1.5 text-[var(--text-muted)] hover:bg-[var(--hover)] hover:text-[var(--text)] rounded-lg border-0 bg-transparent cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="divide-y divide-[var(--border)]">
          <div className="py-3">
            <p className="m-0 mb-2 text-sm font-medium text-[var(--text)]">
              {t("settings.language")}
            </p>
            <LanguageSwitcher variant="panel" />
          </div>

          <Row title={t("settings.theme")}>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={themeButtonClass(!isDark)}
              >
                <Sun className="w-4 h-4" aria-hidden="true" />
                {t("nav.themeLight")}
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={themeButtonClass(isDark)}
              >
                <Moon className="w-4 h-4" aria-hidden="true" />
                {t("nav.themeDark")}
              </button>
            </div>
          </Row>

          <div className="pt-4">
            <button
              type="button"
              onClick={() => {
                onClose();
                logout();
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/15 active:scale-[0.98] transition-all border-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              {t("nav.logout")}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
