import { getTranslations } from "next-intl/server";

export async function PageLoading() {
  const t = await getTranslations();

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <p className="text-[var(--text-muted)]">{t("common.loading")}</p>
    </div>
  );
}
