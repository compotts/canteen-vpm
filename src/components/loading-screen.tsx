"use client";

import { useTranslations } from "next-intl";

export function LoadingScreen() {
  const t = useTranslations();

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <p className="text-[var(--text-muted)]">{t("common.loading")}</p>
    </div>
  );
}
