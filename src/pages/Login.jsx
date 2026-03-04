import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, setAccessToken } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const inputClass =
  'input w-full box-border rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5 text-base font-[var(--font-sans)] text-[var(--text)]';

export function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.login(login, password);
      setAccessToken(res.accessToken);
      setAuth(true);
      navigate('/menu', { replace: true });
    } catch (err) {
      setError(err?.message || t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 max-w-[430px] mx-auto w-full px-4 py-5 box-border">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 shadow-[var(--shadow-sm)] mt-8">
        <h1 className="text-xl font-semibold text-[var(--text)] mt-0 mb-4">{t('login.title')}</h1>
        {error && (
          <div className="rounded-lg border border-[var(--error-border)] bg-[var(--error-bg)] text-[var(--error-text)] px-4 py-3 text-sm mb-4" role="alert">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="login" className="block text-sm font-medium mb-1.5 text-[var(--text)]">
              {t('login.loginLabel')}
            </label>
            <input
              id="login"
              type="text"
              className={inputClass}
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder={t('login.loginPlaceholder')}
              autoComplete="username"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium mb-1.5 text-[var(--text)]">
              {t('login.passwordLabel')}
            </label>
            <input
              id="password"
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('login.passwordPlaceholder')}
              autoComplete="current-password"
              required
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center font-[var(--font-sans)] text-base font-medium py-2.5 px-4 rounded-lg border-none cursor-pointer min-h-12 w-full bg-[var(--accent)] text-[var(--btn-primary-color)] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? t('login.submitting') : t('login.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
