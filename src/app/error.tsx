"use client";

import { useTranslations } from "next-intl";
import { TriangleAlert } from "lucide-react";

export default function AppError({ reset }: { reset: () => void }) {
  const t = useTranslations();

  return (
    <div className="flex-1 max-w-[430px] md:max-w-md mx-auto w-full px-4 py-8 box-border">
      <div className="surface rounded-[var(--radius-lg)] p-5 animate-rise">
        <div className="flex items-center gap-2 mb-3">
          <TriangleAlert
            className="w-5 h-5 text-amber-600 dark:text-amber-400"
            aria-hidden="true"
          />
          <h1 className="text-lg font-semibold text-[var(--text)] m-0">
            {t("errors.title")}
          </h1>
        </div>

        <p className="text-sm text-[var(--text-muted)] leading-relaxed m-0 mb-4">
          {t("errors.text")}
        </p>

        <button
          type="button"
          onClick={reset}
          className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-full bg-[var(--accent)] text-[var(--btn-primary-color)] text-sm font-medium border-0 cursor-pointer"
        >
          {t("errors.retry")}
        </button>
      </div>
    </div>
  );
}
