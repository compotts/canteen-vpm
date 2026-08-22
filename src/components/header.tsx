"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";
import { useAuth } from "./auth-provider";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";
import { useIsAdmin } from "@/hooks/use-is-admin";

const DESKTOP_LINKS = [
  { href: "/", key: "nav.home", adminOnly: false },
  { href: "/admin", key: "nav.admin", adminOnly: true },
  { href: "/menu", key: "nav.catalog", adminOnly: false },
  { href: "/order", key: "nav.order", adminOnly: false },
  { href: "/history", key: "nav.history", adminOnly: false },
] as const;

export function Header() {
  const t = useTranslations();
  const { isAuth, logout } = useAuth();
  const { isAdmin } = useIsAdmin();

  return (
    <header className="glass-strong sticky top-0 z-[800] px-4 py-3 md:px-6">
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
                    className="px-3 py-2 rounded-full text-[var(--text)] no-underline text-sm font-medium hover:bg-[var(--glass-highlight)] transition-colors"
                  >
                    {t(link.key)}
                  </Link>
                )
              )}
            </nav>

            <div className="hidden md:flex items-center gap-2 border-l border-[var(--glass-border)] pl-3 ml-1">
              <LanguageSwitcher />
              <ThemeToggle />
              <button
                type="button"
                className="flex items-center justify-center p-2 rounded-full text-[var(--error-text)] hover:bg-red-500/10 transition-colors"
                onClick={logout}
                aria-label={t("nav.logout")}
                title={t("nav.logout")}
              >
                <LogOut className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="flex md:hidden items-center gap-1.5">
              <LanguageSwitcher variant="mobile" />
              <ThemeToggle compact />
              <button
                type="button"
                className="flex items-center justify-center p-2 rounded-full text-[var(--error-text)] hover:bg-red-500/10 transition-colors"
                onClick={logout}
                aria-label={t("nav.logout")}
                title={t("nav.logout")}
              >
                <LogOut className="w-[18px] h-[18px]" aria-hidden="true" />
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
