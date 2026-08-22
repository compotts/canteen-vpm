"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Clock } from "lucide-react";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { LoadingScreen } from "@/components/loading-screen";
import { UpdatesTab } from "./updates-tab";
import { TranslationsTab } from "./translations-tab";
import { PhotosTab } from "./photos-tab";
import { FeedbackTab } from "./feedback-tab";

const TABS = ["updates", "dishes", "photos", "feedback"] as const;
type Tab = (typeof TABS)[number];

const TITLE_KEYS: Record<Tab, string> = {
  updates: "admin.title",
  dishes: "admin.dishesTitle",
  photos: "admin.photosTitle",
  feedback: "admin.feedbackTitle",
};

const PAGE_CLASS =
  "flex-1 max-w-[430px] md:max-w-4xl mx-auto w-full px-4 md:px-6 py-6 box-border";

export function AdminView() {
  const t = useTranslations();
  const { isAdmin, ready } = useIsAdmin();
  const [tab, setTab] = useState<Tab>("updates");

  if (!ready) return <LoadingScreen />;

  if (!isAdmin) {
    return (
      <div className={PAGE_CLASS}>
        <p className="text-[var(--text)]">{t("admin.accessDenied")}</p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-full bg-[var(--accent)] text-[var(--btn-primary-color)] text-sm font-medium no-underline"
        >
          {t("admin.goHome")}
        </Link>
      </div>
    );
  }

  return (
    <div className={PAGE_CLASS}>
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text)] m-0 flex items-center gap-2">
          <Clock className="w-5 h-5 text-[var(--text-muted)]" />
          {t(TITLE_KEYS[tab])}
        </h1>

        <div className="glass flex rounded-full p-1">
          {TABS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                tab === value
                  ? "bg-[var(--accent)] text-[var(--btn-primary-color)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--glass-highlight)]"
              }`}
            >
              {t(`admin.tabs.${value}`)}
            </button>
          ))}
        </div>
      </div>

      {tab === "updates" && <UpdatesTab key="updates" />}
      {tab === "dishes" && <TranslationsTab key="dishes" />}
      {tab === "photos" && <PhotosTab key="photos" />}
      {tab === "feedback" && <FeedbackTab key="feedback" />}
    </div>
  );
}
