"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { loadSiteContent } from "@/lib/api/site-content";
import { pickTextByLang } from "@/lib/text";
import type { SiteContent, SiteContentKey } from "@/lib/site-content";

export function DesignContent({ section }: { section: SiteContentKey }) {
  const t = useTranslations("design");
  const locale = useLocale();
  const [content, setContent] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    loadSiteContent(controller.signal)
      .then((entries) => {
        if (!controller.signal.aborted)
          setContent(entries.find((entry) => entry.key === section) ?? null);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [section, retry]);

  if (loading)
    return (
      <p className="design-loading" role="status">
        <Loader2 size={18} aria-hidden="true" />
        {t("infoLoading")}
      </p>
    );
  if (error)
    return (
      <div role="alert">
        <p>{t("infoError")}</p>
        <button
          type="button"
          className="design-button"
          onClick={() => {
            setError(false);
            setLoading(true);
            setRetry((previous) => previous + 1);
          }}
        >
          {t("retry")}
        </button>
      </div>
    );
  const text = content ? pickTextByLang(content.text, locale) : "";
  return <div className="design-content-text">{text || t("contentEmpty")}</div>;
}
