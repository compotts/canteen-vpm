"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Clock, LogOut } from "lucide-react";
import { useAdminSession } from "@/components/admin-session-provider";
import { LoadingScreen } from "@/components/loading-screen";
import { closeAdminSession } from "@/lib/api/admin";
import type { AdminPermission } from "@/lib/permissions";
import { AdminLogin } from "./admin-login";
import { UpdatesTab } from "./updates-tab";
import { TranslationsTab } from "./translations-tab";
import { PhotosTab } from "./photos-tab";
import { FeedbackTab } from "./feedback-tab";
import { AdminsTab } from "./admins-tab";

type TabId = AdminPermission | "admins";

type TabDefinition = {
  id: TabId;
  permission: AdminPermission | null;
  labelKey: string;
  titleKey: string;
};

const TABS: TabDefinition[] = [
  {
    id: "updates",
    permission: "updates",
    labelKey: "admin.tabs.updates",
    titleKey: "admin.title",
  },
  {
    id: "translations",
    permission: "translations",
    labelKey: "admin.tabs.dishes",
    titleKey: "admin.dishesTitle",
  },
  {
    id: "photos",
    permission: "photos",
    labelKey: "admin.tabs.photos",
    titleKey: "admin.photosTitle",
  },
  {
    id: "feedback",
    permission: "feedback",
    labelKey: "admin.tabs.feedback",
    titleKey: "admin.feedbackTitle",
  },
  {
    id: "admins",
    permission: null,
    labelKey: "admin.tabs.admins",
    titleKey: "admin.adminsTitle",
  },
];

const PAGE_CLASS =
  "flex-1 max-w-[430px] md:max-w-4xl mx-auto w-full px-4 md:px-6 py-6 box-border";

export function AdminView() {
  const t = useTranslations();
  const { ready, isAdmin, isOwner, can, refresh } = useAdminSession();
  const [preferred, setPreferred] = useState<TabId | null>(null);

  if (!ready) return <LoadingScreen />;

  if (!isAdmin) {
    return (
      <div className={PAGE_CLASS}>
        <AdminLogin />
      </div>
    );
  }

  const visible = TABS.filter((tab) =>
    tab.permission === null ? isOwner : can(tab.permission)
  );

  const active = visible.find((tab) => tab.id === preferred) ?? visible[0];

  const signOut = async () => {
    await closeAdminSession();
    await refresh();
  };

  return (
    <div className={PAGE_CLASS}>
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <h1 className="text-xl md:text-3xl font-bold tracking-tight text-[var(--text)] m-0 flex items-center gap-2 min-w-0">
          <Clock className="w-5 h-5 text-[var(--text-muted)]" />
          {active ? t(active.titleKey) : t("admin.title")}
        </h1>

        <div className="flex items-center gap-2 min-w-0 max-w-full">
          {visible.length > 1 && (
            <div className="surface flex rounded-full p-1 min-w-0 overflow-x-auto no-scrollbar">
              {visible.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPreferred(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap shrink-0 transition-colors ${
                    active?.id === tab.id
                      ? "bg-[var(--accent)] text-[var(--btn-primary-color)]"
                      : "text-[var(--text-muted)] hover:bg-[var(--hover)]"
                  }`}
                >
                  {t(tab.labelKey)}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={signOut}
            aria-label={t("admin.auth.signOut")}
            title={t("admin.auth.signOut")}
            className="inline-flex items-center justify-center p-2 rounded-full text-red-500 hover:bg-red-500/10 border-0 bg-transparent cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {active?.id === "updates" && <UpdatesTab key="updates" />}
      {active?.id === "translations" && <TranslationsTab key="translations" />}
      {active?.id === "photos" && <PhotosTab key="photos" />}
      {active?.id === "feedback" && <FeedbackTab key="feedback" />}
      {active?.id === "admins" && <AdminsTab key="admins" />}
    </div>
  );
}
