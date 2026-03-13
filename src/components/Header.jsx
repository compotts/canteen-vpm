import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useLanguage } from "../hooks/useLanguage.js";
import { useTheme } from "../hooks/useTheme.js";
import { APP_VERSION } from "../constants.js";
import { Sun, Moon } from "lucide-react";

export default function Header() {
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
    <header className="bg-[var(--surface)] border-b border-[var(--border)] px-4 py-3 md:px-6 shadow-[var(--shadow-sm)]">
      <div className="max-w-[430px] md:max-w-4xl mx-auto flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 no-underline text-inherit">
          <img src="/icon.svg" alt="" width={45} height={18} className="block" />
          <span className="text-xl font-bold text-[var(--text)]">Valgyklos VPM</span>
        </a>
        <div className="flex items-center gap-3">
          {isAuth && (
            <>
              <button
                type="button"
                className="md:hidden flex flex-col gap-[5px] p-2 bg-transparent border-none cursor-pointer rounded"
                onClick={() => setDrawerOpen(v => !v)}
                aria-label={t("nav.catalog")}
                aria-expanded={drawerOpen}
              >
                <span className="w-[22px] h-0.5 bg-[var(--text)] rounded-sm" />
                <span className="w-[22px] h-0.5 bg-[var(--text)] rounded-sm" />
                <span className="w-[22px] h-0.5 bg-[var(--text)] rounded-sm" />
              </button>
              <nav className="hidden md:flex items-center gap-1" aria-label={t("nav.catalog")}>
                <Link
                  to="/"
                  className="px-3 py-2 rounded-lg text-[var(--text)] no-underline text-sm font-medium hover:bg-[var(--border-subtle)] transition-colors"
                  onClick={closeDrawer}
                >
                  {t("nav.home")}
                </Link>
                <Link
                  to="/menu"
                  className="px-3 py-2 rounded-lg text-[var(--text)] no-underline text-sm font-medium hover:bg-[var(--border-subtle)] transition-colors"
                  onClick={closeDrawer}
                >
                  {t("nav.catalog")}
                </Link>
                <Link
                  to="/order"
                  className="px-3 py-2 rounded-lg text-[var(--text)] no-underline text-sm font-medium hover:bg-[var(--border-subtle)] transition-colors"
                  onClick={closeDrawer}
                >
                  {t("nav.order")}
                </Link>
                <Link
                  to="/history"
                  className="px-3 py-2 rounded-lg text-[var(--text)] no-underline text-sm font-medium hover:bg-[var(--border-subtle)] transition-colors"
                  onClick={closeDrawer}
                >
                  {t("nav.history")}
                </Link>
              </nav>
              <div className="hidden md:flex items-center gap-2 border-l border-[var(--border)] pl-3 ml-1">
                {langs.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setLang(l.code)}
                    className={`px-2.5 py-1.5 text-sm font-medium border-none rounded-md cursor-pointer transition-colors ${
                      lang === l.code
                        ? "bg-[var(--accent)] text-[var(--btn-primary-color)]"
                        : "bg-transparent text-[var(--text-muted)] hover:bg-[var(--border-subtle)] hover:text-[var(--text)]"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
                <button
                  type="button"
                  className="flex items-center justify-center p-2 bg-[var(--border-subtle)] border-none rounded-lg cursor-pointer text-[var(--text)] hover:bg-[var(--border)] transition-colors"
                  onClick={toggle}
                  aria-label={isDark ? t("nav.themeLight") : t("nav.themeDark")}
                >
                  {isDark ? <Sun className="w-5 h-5" aria-hidden="true" /> : <Moon className="w-5 h-5" aria-hidden="true" />}
                </button>
              </div>
              <button
                type="button"
                className="hidden md:block px-3 py-2 rounded-lg text-sm font-medium text-[var(--error-text)] hover:bg-red-500/10 transition-colors"
                onClick={logout}
              >
                {t("nav.logout")}
              </button>
            </>
          )}
        </div>
      </div>

      {isAuth && (
        <>
          <div
            role="presentation"
            className={`md:hidden fixed inset-0 bg-black/50 z-[999] transition-all duration-200 ${drawerOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
            onClick={closeDrawer}
          />
          <nav
            className="md:hidden fixed top-0 left-0 z-[1000] h-full w-[min(280px,85vw)] bg-[var(--surface)] shadow-[4px_0_20px_rgba(0,0,0,0.15)] flex flex-col pt-6 transition-transform duration-200"
            style={{
              transform: drawerOpen ? "translate3d(0,0,0)" : "translate3d(-100%,0,0)",
              willChange: "transform",
            }}
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
              <Link
                to="/order"
                className="block py-3.5 px-5 text-[var(--text)] no-underline text-base font-medium border-none bg-transparent w-full text-left cursor-pointer font-[var(--font-sans)]"
                onClick={closeDrawer}
              >
                {t("nav.order")}
              </Link>
              <Link
                to="/history"
                className="block py-3.5 px-5 text-[var(--text)] no-underline text-base font-medium border-none bg-transparent w-full text-left cursor-pointer font-[var(--font-sans)]"
                onClick={closeDrawer}
              >
                {t("nav.history")}
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
            <p className="text-[15px] text-[var(--text-muted)] m-0 px-3 pt-2 pb-1 opacity-80">{APP_VERSION}</p>
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
                {isDark ? <Sun className="w-[18px] h-[18px]" aria-hidden="true" /> : <Moon className="w-[18px] h-[18px]" aria-hidden="true" />}
              </button>
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
