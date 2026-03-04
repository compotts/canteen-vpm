import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useLanguage } from "../hooks/useLanguage.js";
import { useTheme } from "../hooks/useTheme.js";

export function Header() {
  const { t } = useTranslation();
  const { isAuth, logout } = useAuth();
  const { lang, setLang, langs } = useLanguage();
  const { isDark, toggle } = useTheme();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <header className="bg-[var(--surface)] border-b border-[var(--border)] px-4 py-3 shadow-[var(--shadow-sm)]">
      <div className="max-w-[430px] mx-auto flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 no-underline text-inherit">
          <img src="/icon.svg" alt="" width={45} height={18} className="block" />
          <span className="text-xl font-bold text-[var(--text)]">Valgyklos VPM</span>
        </a>
        <div className="flex items-center">
          {isAuth && (
            <button
              type="button"
              className="flex flex-col gap-[5px] p-2 bg-transparent border-none cursor-pointer rounded"
              onClick={() => setDrawerOpen(true)}
              aria-label={t("nav.catalog")}
              aria-expanded={drawerOpen}
            >
              <span className="w-[22px] h-0.5 bg-[var(--text)] rounded-sm" />
              <span className="w-[22px] h-0.5 bg-[var(--text)] rounded-sm" />
              <span className="w-[22px] h-0.5 bg-[var(--text)] rounded-sm" />
            </button>
          )}
        </div>
      </div>

      {isAuth && (
        <>
          <div
            role="presentation"
            className={`fixed inset-0 bg-black/50 z-[999] transition-all duration-200 ${drawerOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
            onClick={closeDrawer}
          />
          <nav
            className={`fixed top-0 left-0 w-[min(280px,85vw)] h-full max-h-[100dvh] bg-[var(--surface)] shadow-[4px_0_20px_rgba(0,0,0,0.15)] z-[1000] flex flex-col pt-6 overflow-x-hidden overflow-y-hidden box-border transition-transform duration-[0.25s] ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}
            aria-hidden={!drawerOpen}
          >
            <div className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto">
              <Link
                to="/"
                className="block py-3.5 px-5 text-[var(--text)] no-underline text-base font-medium border-none bg-transparent w-full text-left cursor-pointer font-[var(--font-sans)]"
                onClick={closeDrawer}
              >
                {t("nav.home")}
              </Link>
              <Link
                to="/menu"
                className="block py-3.5 px-5 text-[var(--text)] no-underline text-base font-medium border-none bg-transparent w-full text-left cursor-pointer font-[var(--font-sans)]"
                onClick={closeDrawer}
              >
                {t("nav.catalog")}
              </Link>
              <button
                type="button"
                className="block py-3.5 px-5 text-[var(--error-text)] no-underline text-base font-medium border-none bg-transparent w-full text-left cursor-pointer font-[var(--font-sans)]"
                onClick={() => {
                  closeDrawer();
                  logout();
                }}
              >
                {t("nav.logout")}
              </button>
            </div>
            <div className="flex-shrink-0 flex items-center justify-between gap-3 border-t border-[var(--border)] px-5 py-4 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] box-border">
              <div className="flex flex-col gap-1">
                <div className="flex gap-1">
                  {langs.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => setLang(l.code)}
                      className={`px-3 py-1.5 text-sm font-medium border-none rounded-md cursor-pointer font-[var(--font-sans)] transition-colors ${
                        lang === l.code
                          ? "bg-[var(--accent)] text-[var(--btn-primary-color)]"
                          : "bg-transparent text-[var(--text-muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--text)]"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[var(--text-muted)] m-0">* {t("nav.translationDisclaimer")}</p>
              </div>
              <button
                type="button"
                className="flex items-center justify-center flex-shrink-0 p-2 bg-[var(--border-subtle)] border-none rounded-lg cursor-pointer text-[var(--text)] transition-colors hover:bg-[var(--border)]"
                onClick={toggle}
                aria-label={isDark ? t("nav.themeLight") : t("nav.themeDark")}
              >
                {isDark ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
