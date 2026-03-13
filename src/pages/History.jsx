import { useTranslation } from "react-i18next";

export default function History() {
  const { t } = useTranslation();

  return (
    <div className="flex-1 max-w-[430px] md:max-w-4xl mx-auto w-full px-4 md:px-6 py-5 box-border pb-24">
      <h1 className="text-xl md:text-2xl font-semibold text-[var(--text)] m-0 mb-3">
        {t("nav.history")}
      </h1>
      <p className="text-[var(--text-muted)] leading-relaxed">
        {t("history.placeholder")} 🙂
      </p>
    </div>
  );
}
