import { useTranslation } from 'react-i18next';

export function Order() {
  const { t } = useTranslation();
  return (
    <div className="flex-1 max-w-[430px] mx-auto w-full px-4 py-5 box-border">
      <h1 className="text-xl font-semibold text-[var(--text)] m-0 mb-4">
        {t('nav.order')}
      </h1>
      <p className="text-[var(--text-muted)] text-sm">
        ...
      </p>
    </div>
  );
}

