import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api.js';
import { LOCALE_MAP, DEFAULT_LANG } from '../constants.js';

function formatDate(iso, locale = DEFAULT_LANG) {
  return new Date(iso + 'T12:00:00').toLocaleDateString(LOCALE_MAP[locale] || 'lt-LT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function roundToStep(value, step) {
  if (step <= 0) return Math.max(0, value);
  return Math.max(0, Math.round((Math.round(value / step) * step) * 100) / 100);
}

const inputClass =
  'input w-full box-border rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2.5 text-base font-[var(--font-sans)] text-[var(--text)]';

export function Menu() {
  const { t, i18n } = useTranslation();
  const [menu, setMenu] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderResult, setOrderResult] = useState(null);

  const loadMenu = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const data = await api.getMenuToday();
      setMenu(data);
      const next = {};
      data.items.forEach((i) => { next[i.id] = 0; });
      setQuantities((prev) => ({ ...prev, ...next }));
    } catch (err) {
      setError(err?.message || t('menu.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadMenu(); }, [loadMenu]);

  const setQty = (id, step, value) => {
    setQuantities((prev) => ({ ...prev, [id]: roundToStep(value, step) }));
  };

  const total = menu ? menu.items.reduce((sum, item) => sum + item.price * (quantities[item.id] ?? 0), 0) : 0;
  const hasAnyQty = menu ? menu.items.some((item) => (quantities[item.id] ?? 0) > 0) : false;

  const handleSubmit = async () => {
    if (!menu || !hasAnyQty) return;
    setOrderLoading(true);
    setOrderResult(null);
    try {
      const items = menu.items
        .filter((item) => (quantities[item.id] ?? 0) > 0)
        .map((item) => ({ menuItemId: item.id, qty: quantities[item.id] ?? 0 }));
      const res = await api.submitOrder(menu.date, items);
      setOrderResult({ success: true, orderId: res.orderId });
    } catch (err) {
      setOrderResult({ success: false, message: err?.message || t('menu.loadError') });
    } finally {
      setOrderLoading(false);
    }
  };

  const closeResult = (wasSuccess) => {
    const ok = wasSuccess ?? orderResult?.success;
    setOrderResult(null);
    if (ok && menu) {
      setQuantities((prev) => {
        const next = { ...prev };
        menu.items.forEach((i) => (next[i.id] = 0));
        return next;
      });
    }
  };

  const lang = i18n.language || DEFAULT_LANG;

  if (loading) {
    return (
      <div className="flex-1 max-w-[430px] mx-auto w-full px-4 py-5 box-border">
        <p className="text-[var(--text-muted)]">{t('menu.loading')}</p>
      </div>
    );
  }
  if (error || !menu) {
    return (
      <div className="flex-1 max-w-[430px] mx-auto w-full px-4 py-5 box-border">
        <div className="rounded-lg border border-[var(--error-border)] bg-[var(--error-bg)] text-[var(--error-text)] px-4 py-3 text-sm mb-4">
          {error || t('menu.menuUnavailable')}
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center font-[var(--font-sans)] text-base font-medium py-2.5 px-4 rounded-lg border-none cursor-pointer min-h-12 bg-[var(--border-subtle)] text-[var(--text)] disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={loadMenu}
        >
          {t('menu.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-[430px] mx-auto w-full px-4 py-5 box-border">
      <h1 className="text-xl font-semibold text-[var(--text)] m-0 mb-4">
        {t('menu.today')}, {formatDate(menu.date, lang)}
      </h1>
      <ul className="list-none p-0 mb-[100px]">
        {menu.items.map((item) => (
          <li
            key={item.id}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 shadow-[var(--shadow-sm)] mb-3"
          >
            <div className="flex justify-between items-center flex-wrap gap-3">
              <div>
                <div className="font-semibold text-[var(--text)]">{item.name}</div>
                <div className="text-sm text-[var(--text-muted)]">
                  {item.price.toFixed(2)} €
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className={`${inputClass} w-20 text-center`}
                  min={0}
                  step={item.step}
                  value={quantities[item.id] ?? 0}
                  onChange={(e) => setQty(item.id, item.step, parseFloat(e.target.value) || 0)}
                  inputMode="decimal"
                />
                <span className="text-sm text-[var(--text-muted)]">{t('menu.portions')}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-[var(--surface)] border-t border-[var(--border)] p-4 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
        <div className="flex justify-between items-center mb-3">
          <span className="font-semibold text-[var(--text)]">{t('menu.total')}:</span>
          <span className="font-bold text-lg text-[var(--text)]">
            {total.toFixed(2)} €
          </span>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center font-[var(--font-sans)] text-base font-medium py-2.5 px-4 rounded-lg border-none cursor-pointer min-h-12 w-full bg-[var(--accent)] text-[var(--btn-primary-color)] disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!hasAnyQty || orderLoading}
          onClick={handleSubmit}
        >
          {orderLoading ? t('menu.submitting') : t('menu.submit')}
        </button>
      </div>
      {orderResult && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4"
          onClick={(e) => e.target === e.currentTarget && closeResult(false)}
        >
          <div
            className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 shadow-[var(--shadow-sm)] max-w-[320px] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-[var(--text)] mt-0 mb-4">
              {orderResult.success ? t('menu.orderSuccess') : t('menu.orderError')}
            </h2>
            {orderResult.success && orderResult.orderId && (
              <p className="text-[var(--text-muted)] mb-4">
                {t('menu.orderNumber')}: {orderResult.orderId}
              </p>
            )}
            {!orderResult.success && orderResult.message && (
              <div className="rounded-lg border border-[var(--error-border)] bg-[var(--error-bg)] text-[var(--error-text)] px-4 py-3 text-sm mb-4">
                {orderResult.message}
              </div>
            )}
            <button
              type="button"
              className="inline-flex items-center justify-center font-[var(--font-sans)] text-base font-medium py-2.5 px-4 rounded-lg border-none cursor-pointer min-h-12 w-full bg-[var(--accent)] text-[var(--btn-primary-color)] disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => closeResult(orderResult?.success)}
            >
              {orderResult.success ? t('menu.backToMenu') : t('menu.ok')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
