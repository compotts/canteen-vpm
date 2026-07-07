import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useLanguage } from "../hooks/useLanguage.js";
import { useTheme } from "../hooks/useTheme.js";
import { Sun, Moon, LogOut } from "lucide-react";
import { isStoredUserAdmin } from "../services/userStorage.js";

const DESKTOP_LINKS = [
  { to: "/", key: "nav.home", adminOnly: false },
  { to: "/admin", key: "nav.admin", adminOnly: true },
  { to: "/menu", key: "nav.catalog", adminOnly: false },
  { to: "/order", key: "nav.order", adminOnly: false },
  { to: "/history", key: "nav.history", adminOnly: false },
];

export default function Header() {
  const { t } = useTranslation();
  const { isAuth, logout } = useAuth();
  const { lang, setLang, langs } = useLanguage();
  const { isDark, toggle } = useTheme();
  const isAdmin = isStoredUserAdmin();

  return (
    <header className="glass-strong sticky top-0 z-[800] px-4 py-3 md:px-6">
      <div className="max-w-[430px] md:max-w-4xl mx-auto flex items-center justify-between gap-3">
        <a href="/" className="flex items-center gap-2 no-underline text-inherit shrink-0">
          <img src="/icon.svg" alt="" width={45} height={18} className="block" />
          <span className="hidden sm:inline text-xl font-bold tracking-tight text-[var(--text)]">Valgyklos VPM</span>
        </a>

        {isAuth && (
          <>
            {/* Desktop navigation */}
            <nav className="hidden md:flex items-center gap-1" aria-label={t("nav.catalog")}>
              {DESKTOP_LINKS.filter((l) => !l.adminOnly || isAdmin).map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="px-3 py-2 rounded-full text-[var(--text)] no-underline text-sm font-medium hover:bg-[var(--glass-highlight)] transition-colors"
                >
                  {t(l.key)}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-2 border-l border-[var(--glass-border)] pl-3 ml-1">
              {langs.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLang(l.code)}
                  className={`px-2.5 py-1.5 text-sm font-medium border-none rounded-full cursor-pointer transition-colors ${
                    lang === l.code
                      ? "bg-[var(--accent)] text-[var(--btn-primary-color)]"
                      : "bg-transparent text-[var(--text-muted)] hover:bg-[var(--glass-highlight)] hover:text-[var(--text)]"
                  }`}
                >
                  {l.label}
                </button>
              ))}
              <button
                type="button"
                className="flex items-center justify-center p-2 rounded-full cursor-pointer text-[var(--text)] hover:bg-[var(--glass-highlight)] transition-colors"
                onClick={toggle}
                aria-label={isDark ? t("nav.themeLight") : t("nav.themeDark")}
              >
                {isDark ? <Sun className="w-5 h-5" aria-hidden="true" /> : <Moon className="w-5 h-5" aria-hidden="true" />}
              </button>
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

            {/* Mobile controls — navigation lives in the bottom tab bar */}
            <div className="flex md:hidden items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                {langs.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setLang(l.code)}
                    className={`px-2 py-1 text-xs font-semibold border-none rounded-full cursor-pointer transition-colors ${
                      lang === l.code
                        ? "bg-[var(--accent)] text-[var(--btn-primary-color)]"
                        : "bg-transparent text-[var(--text-muted)]"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="flex items-center justify-center p-2 rounded-full cursor-pointer text-[var(--text)] hover:bg-[var(--glass-highlight)] transition-colors"
                onClick={toggle}
                aria-label={isDark ? t("nav.themeLight") : t("nav.themeDark")}
              >
                {isDark ? <Sun className="w-[18px] h-[18px]" aria-hidden="true" /> : <Moon className="w-[18px] h-[18px]" aria-hidden="true" />}
              </button>
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
