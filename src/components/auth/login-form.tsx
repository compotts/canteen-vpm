"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import {
  ArrowRight,
  CircleHelp,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Moon,
  Snowflake,
  Sparkles,
  Sun,
  UserRound,
} from "lucide-react";
import { INVALID_CREDENTIALS, login } from "@/lib/valgykla/client";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/components/auth-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { DesignDialog } from "@/components/design/design-dialog";
import { getColorTheme, getThemeName, isDarkTheme } from "@/lib/themes";
import {
  REMEMBER_ME_KEY,
  SAVED_PASSWORD_KEY,
  SAVED_USERNAME_KEY,
} from "@/lib/constants";
import { WinterLunchArt } from "./winter-lunch-art";

export function LoginForm() {
  const t = useTranslations();
  const { setAuth } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const dark = isDarkTheme(resolvedTheme);
  const submitting = useRef(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const closeHelp = useCallback(() => setHelpOpen(false), []);

  useEffect(() => {
    try {
      setUsername(localStorage.getItem(SAVED_USERNAME_KEY) ?? "");
      setPassword(localStorage.getItem(SAVED_PASSWORD_KEY) ?? "");
      setRememberMe(localStorage.getItem(REMEMBER_ME_KEY) === "1");
    } catch {}
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting.current || !username.trim() || !password) return;
    submitting.current = true;
    setLoading(true);
    setError(null);
    const name = username.trim();
    try {
      await login(name, password);
      try {
        localStorage.setItem(SAVED_USERNAME_KEY, name);
        if (rememberMe) {
          localStorage.setItem(REMEMBER_ME_KEY, "1");
          localStorage.setItem(SAVED_PASSWORD_KEY, password);
        } else {
          localStorage.removeItem(REMEMBER_ME_KEY);
          localStorage.removeItem(SAVED_PASSWORD_KEY);
        }
      } catch {}
      setAuth(true);
    } catch (cause) {
      const wrongPassword =
        cause instanceof ApiError && cause.message === INVALID_CREDENTIALS;
      setError(wrongPassword ? t("login.error") : t("status.loginUnavailable"));
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="design-preview design-login">
      <div className="login-snow" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <Snowflake key={index} />
        ))}
      </div>
      <header className="login-header">
        <Link href="/" className="login-brand" aria-label="Valgyklos VPM">
          <img src="/icon.svg" alt="" width={34} height={24} />
          <span>Valgyklos VPM</span>
        </Link>
        <div className="login-tools">
          <div className="login-languages">
            <LanguageSwitcher variant="mobile" />
          </div>
          <button
            type="button"
            className="login-theme-toggle"
            aria-label={t(dark ? "design.theme.light" : "design.theme.dark")}
            onClick={() =>
              setTheme(getThemeName(getColorTheme(resolvedTheme), !dark))
            }
          >
            {dark ? (
              <Sun size={19} aria-hidden="true" />
            ) : (
              <Moon size={19} aria-hidden="true" />
            )}
          </button>
        </div>
      </header>
      <main className="login-layout">
        <section className="login-welcome" aria-labelledby="welcome-title">
          <div className="login-season">
            <Sparkles size={14} aria-hidden="true" />
            {t("login.winter.season")}
          </div>
          <h1 id="welcome-title">
            {t("login.winter.headline")}
            <br />
            <em>{t("login.winter.headlineAccent")}</em>
          </h1>
          <p className="login-intro">{t("login.winter.intro")}</p>
          <div className="login-art">
            <span className="login-art-orbit" aria-hidden="true" />
            <WinterLunchArt />
            <div className="login-art-caption">
              <span aria-hidden="true">✦</span>
              {t("login.winter.artCaption")}
              <span className="login-art-caption-line" aria-hidden="true" />
            </div>
          </div>
        </section>
        <section className="login-card" aria-labelledby="login-title">
          <div className="login-card-decoration" aria-hidden="true">
            <Snowflake size={58} />
            <span>✦</span>
          </div>
          <span className="login-card-eyebrow">
            {t("login.winter.welcome")}
          </span>
          <h2 id="login-title">
            {t("login.title")}
            <span>.</span>
          </h2>
          <p className="login-card-intro" id="login-description">
            {t("login.winter.credentials")}
          </p>
          {error && (
            <div id="login-error" className="login-error" role="alert">
              <CircleHelp size={18} aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
          <form
            onSubmit={handleSubmit}
            aria-describedby="login-description"
            aria-busy={loading}
          >
            <div className="login-field">
              <label htmlFor="login-username">{t("login.loginLabel")}</label>
              <div className="login-input-wrap">
                <UserRound size={18} aria-hidden="true" />
                <input
                  id="login-username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder={t("login.loginPlaceholder")}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  disabled={loading}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "login-error" : undefined}
                />
              </div>
            </div>
            <div className="login-field">
              <label htmlFor="login-password">{t("login.passwordLabel")}</label>
              <div className="login-input-wrap">
                <LockKeyhole size={18} aria-hidden="true" />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={t("login.passwordPlaceholder")}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "login-error" : undefined}
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={t(
                    showPassword ? "login.hidePassword" : "login.showPassword",
                  )}
                  aria-controls="login-password"
                  aria-pressed={showPassword}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
            <label className="login-remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                disabled={loading}
              />
              <span>{t("login.rememberMe")}</span>
            </label>
            <button
              type="submit"
              className="login-submit"
              disabled={loading || !username.trim() || !password}
            >
              {loading ? (
                <LoaderCircle
                  className="login-spinner"
                  size={18}
                  aria-hidden="true"
                />
              ) : null}
              {t(loading ? "login.submitting" : "login.submit")}
              {!loading && <ArrowRight size={19} aria-hidden="true" />}
            </button>
          </form>
          <button
            type="button"
            className="login-help"
            onClick={() => setHelpOpen(true)}
          >
            <CircleHelp size={16} aria-hidden="true" />
            {t("login.cantLogin")}
          </button>
        </section>
      </main>
      <footer className="login-footer">
        <span>
          <Snowflake size={13} aria-hidden="true" />
          {t("login.winter.footer")}
        </span>
        <Link href="/old-design" prefetch={false}>
          {t("login.winter.legacy")}
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </footer>
      {helpOpen && (
        <DesignDialog title={t("login.helpTitle")} onClose={closeHelp}>
          <div className="login-help-content">
            <p>{t("login.helpIntro")}</p>
            <ul>
              <li>{t("login.helpStudent")}</li>
              <li>{t("login.helpStaff")}</li>
            </ul>
            <strong>{t("login.helpAdminTitle")}</strong>
            <p>
              {t("login.helpAdminName")}
              <br />
              <a href="mailto:it.pagalba@vpm.lt">{t("login.helpAdminEmail")}</a>
            </p>
            <button type="button" className="design-button" onClick={closeHelp}>
              {t("login.helpClose")}
            </button>
          </div>
        </DesignDialog>
      )}
      <div id="design-dialog-root" />
    </div>
  );
}
