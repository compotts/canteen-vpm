"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Settings } from "lucide-react";
import { useAuth } from "./auth-provider";
import { SettingsPanel } from "./settings-panel";
import { useAdminSession } from "./admin-session-provider";

const DESKTOP_LINKS = [
  { href: "/", key: "nav.home", adminOnly: false },
  { href: "/admin", key: "nav.admin", adminOnly: true },
  { href: "/menu", key: "nav.catalog", adminOnly: false },
  { href: "/order", key: "nav.order", adminOnly: false },
  { href: "/history", key: "nav.history", adminOnly: false },
] as const;

export function Header() {
  const t = useTranslations();
  const { isAuth } = useAuth();
  const { isAdmin } = useAdminSession();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <header className="surface-raised sticky top-0 z-[800] border-x-0 border-t-0 px-4 py-3 md:px-6">
      <div className="max-w-[430px] md:max-w-4xl mx-auto flex items-center justify-between gap-3">
        <Link
          href="/"
          className="flex items-center gap-2 no-underline text-inherit shrink-0"
        >
          <img src="/icon.svg" alt="" width={45} height={18} className="block" />
          <span className="hidden sm:inline text-xl font-bold tracking-tight text-[var(--text)]">
            Valgyklos VPM
          </span>
        </Link>

        {isAuth && (
          <>
            <nav
              className="hidden md:flex items-center gap-1"
              aria-label={t("nav.catalog")}
            >
              {DESKTOP_LINKS.filter((link) => !link.adminOnly || isAdmin).map(
                (link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-3 py-2 rounded-full text-[var(--text)] no-underline text-sm font-medium hover:bg-[var(--hover)] transition-colors"
                  >
                    {t(link.key)}
                  </Link>
                )
              )}
            </nav>

            <div className="flex items-center md:border-l md:border-[var(--border)] md:pl-3 md:ml-1">
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                aria-label={t("nav.settings")}
                title={t("nav.settings")}
                className="flex items-center justify-center p-2 rounded-full cursor-pointer text-[var(--text)] hover:bg-[var(--hover)] transition-colors"
              >
                <Settings className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </>
        )}
      </div>

      {settingsOpen && (
        <SettingsPanel onClose={() => setSettingsOpen(false)} />
      )}
    </header>
  );
}
