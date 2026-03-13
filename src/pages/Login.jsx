import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import { login as valgyklaLogin } from "../services/valgykla.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { REMEMBER_ME_KEY, SAVED_USERNAME_KEY, SAVED_PASSWORD_KEY } from "../constants.js";

const inputClass = "w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5 text-base text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--text-muted)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]";

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [username, setUsername] = useState(() => localStorage.getItem(SAVED_USERNAME_KEY) ?? "");
  const [password, setPassword] = useState(() => localStorage.getItem(SAVED_PASSWORD_KEY) ?? "");
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem(REMEMBER_ME_KEY) === "1");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await valgyklaLogin(username, password);
      if (rememberMe) {
        localStorage.setItem(REMEMBER_ME_KEY, "1");
        localStorage.setItem(SAVED_USERNAME_KEY, username);
        localStorage.setItem(SAVED_PASSWORD_KEY, password);
      } else {
        localStorage.removeItem(REMEMBER_ME_KEY);
        localStorage.removeItem(SAVED_USERNAME_KEY);
        localStorage.removeItem(SAVED_PASSWORD_KEY);
      }
      setAuth(true);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || t("login.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 max-w-[430px] md:max-w-md mx-auto w-full px-4 md:px-6 py-5 md:py-8 box-border flex flex-col md:justify-center">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 md:p-6 shadow-[var(--shadow-sm)] mt-8 md:mt-0 w-full">
        <h1 className="text-xl md:text-2xl font-semibold text-[var(--text)] mt-0 mb-4">
          {t("login.title")}
        </h1>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="login" className="block text-sm font-medium mb-1.5 text-[var(--text)]">
              {t("login.loginLabel")}
            </label>
            <input
              id="login"
              type="text"
              className={inputClass}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t("login.loginPlaceholder")}
              autoComplete="username"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium mb-1.5 text-[var(--text)]">
              {t("login.passwordLabel")}
            </label>

            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className={`${inputClass} pr-10`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("login.passwordPlaceholder")}
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-2 flex items-center p-1 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <input
              id="remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-[var(--border)]"
            />
            <label htmlFor="remember" className="text-sm text-[var(--text)]">
              {t("login.rememberMe")}
            </label>
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center font-[var(--font-sans)] text-base font-medium py-2.5 px-4 rounded-lg border-none cursor-pointer min-h-12 w-full bg-[var(--accent)] text-[var(--btn-primary-color)] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? t("login.submitting") : t("login.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}