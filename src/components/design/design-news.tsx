"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Bell, Loader2, MessageSquare } from "lucide-react";
import { loadUpdates } from "@/lib/api/updates";
import { pickTextByLang } from "@/lib/text";
import type { AppUpdate } from "@/types/api";
import { DesignDialog } from "./design-dialog";

const SEEN_KEY = "valgyklos_updates_seen";

function readSeen(): number {
  try {
    const value = Number(localStorage.getItem(SEEN_KEY));
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

function updateTime(update: AppUpdate): number {
  return Date.parse(update.updatedAt) || Date.parse(update.createdAt) || 0;
}

export function DesignNews({ onReport }: { onReport: () => void }) {
  const t = useTranslations("design");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [updates, setUpdates] = useState<AppUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [seen, setSeen] = useState(0);
  const openRef = useRef(false);
  const controller = useRef<AbortController | null>(null);

  const markSeen = useCallback((entries: AppUpdate[]) => {
    const value = Math.max(readSeen(), ...entries.map(updateTime), 0);
    setSeen(value);
    try {
      localStorage.setItem(SEEN_KEY, String(value));
    } catch {
      return;
    }
  }, []);

  const requestUpdates = useCallback(() => {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    loadUpdates(request.signal)
      .then((entries) => {
        if (request.signal.aborted) return;
        setUpdates(entries);
        setError(false);
        if (openRef.current) markSeen(entries);
        else setSeen(readSeen());
      })
      .catch(() => {
        if (!request.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!request.signal.aborted) setLoading(false);
      });
  }, [markSeen]);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(false);
    requestUpdates();
  }, [requestUpdates]);

  useEffect(() => {
    requestUpdates();
    window.addEventListener("focus", refresh);
    return () => {
      controller.current?.abort();
      window.removeEventListener("focus", refresh);
    };
  }, [requestUpdates, refresh]);

  const close = useCallback(() => {
    setOpen(false);
    openRef.current = false;
  }, []);
  const unread = updates.filter((update) => updateTime(update) > seen).length;

  return (
    <>
      <button
        type="button"
        className="design-icon-button design-news-trigger"
        aria-label={
          unread ? t("newsUnread", { count: unread }) : t("newsTitle")
        }
        aria-expanded={open}
        onClick={() => {
          setOpen(true);
          openRef.current = true;
          markSeen(updates);
          refresh();
        }}
      >
        <Bell size={21} aria-hidden="true" />
        {unread > 0 && (
          <span className="design-news-count" aria-hidden="true">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
      {open && (
        <DesignDialog title={t("newsTitle")} onClose={close}>
          {loading && (
            <p className="design-loading" role="status">
              <Loader2 size={17} aria-hidden="true" />
              {t("infoLoading")}
            </p>
          )}
          {error && (
            <div role="alert">
              <p>{t("newsError")}</p>
              <button type="button" className="design-button" onClick={refresh}>
                {t("retry")}
              </button>
            </div>
          )}
          {!loading && !error && updates.length === 0 && (
            <p>{t("newsEmpty")}</p>
          )}
          <ol className="design-news-list">
            {updates.map((update) => (
              <li key={update.id}>
                <div className="design-news-meta">
                  <time dateTime={update.createdAt}>
                    {update.dateLabel ||
                      new Intl.DateTimeFormat(locale, {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }).format(new Date(update.createdAt))}
                  </time>
                  {update.version && <span>{update.version}</span>}
                </div>
                <p>
                  {update.emoji && (
                    <span aria-hidden="true">{update.emoji} </span>
                  )}
                  {pickTextByLang(update.text, locale)}
                </p>
              </li>
            ))}
          </ol>
          <div className="design-news-feedback">
            <p>{t("feedbackHint")}</p>
            <button
              type="button"
              className="design-button"
              onClick={() => {
                close();
                onReport();
              }}
            >
              <MessageSquare size={17} aria-hidden="true" />
              {t("reportProblem")}
            </button>
          </div>
        </DesignDialog>
      )}
    </>
  );
}
