"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, RefreshCw } from "lucide-react";
import { ACTIVITY_ACTIONS, ACTIVITY_STATUSES, type ActivityEntry } from "@/lib/activity";
import { loadActivity } from "@/lib/api/activity";
import { ErrorBanner } from "./error-banner";

const inputClass =
  "w-full min-w-0 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)]";

const initialFilters = {
  category: "",
  action: "",
  status: "",
  username: "",
  from: "",
  to: "",
};

function ActivityDetails({ entry }: { entry: ActivityEntry }) {
  const t = useTranslations("admin.logs");
  const details = entry.details;
  const quantities = details.quantities;
  const items = details.items;

  return (
    <details className="mt-3 border-t border-[var(--border)] pt-2 text-sm">
      <summary className="py-1 text-xs text-[var(--text-muted)] cursor-pointer">
        {t("details")}
      </summary>
      {quantities && typeof quantities === "object" && !Array.isArray(quantities) ? (
        <ul className="my-2 list-none space-y-1 p-0">
          {Object.entries(quantities).filter(([, value]) => Number(value) > 0).map(([id, quantity]) => (
            <li key={id} className="flex justify-between gap-3 text-xs">
              <span>{t("dishId", { id })}</span>
              <span className="tabular-nums">{String(quantity)} {t("portions")}</span>
            </li>
          ))}
          {Object.values(quantities).every((value) => !(Number(value) > 0)) && (
            <li className="text-xs text-[var(--text-muted)]">{t("emptyOrder")}</li>
          )}
        </ul>
      ) : null}
      {Array.isArray(items) && (
        <ul className="my-2 list-none space-y-2 p-0">
          {items.map((item, index) => {
            if (!item || typeof item !== "object") return null;
            return (
              <li key={index} className="flex items-start justify-between gap-3 text-xs">
                <span className="min-w-0 break-words">{String(item.name ?? item.id ?? "")}</span>
                <span className="shrink-0 tabular-nums">
                  {String(item.quantity ?? 0)} {t("portions")}, {Number(item.totalPrice ?? 0).toFixed(2)} €
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {typeof details.orderTotal === "number" && (
        <p className="my-2 text-xs font-medium">{t("total")}: {details.orderTotal.toFixed(2)} €</p>
      )}
      <pre className="m-0 mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-[var(--hover)] p-3 text-xs text-[var(--text-muted)]">
        {JSON.stringify(details, null, 2)}
      </pre>
    </details>
  );
}

export function ActivityTab() {
  const t = useTranslations("admin.logs");
  const locale = useLocale();
  const [draft, setDraft] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const generation = useRef(0);
  const moreRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    generation.current += 1;
    moreRequest.current?.abort();
    setLoading(true);
    setLoadingMore(false);
    setError(null);
    setEntries([]);
    setCursor(null);
    loadActivity(filters, controller.signal)
      .then((page) => {
        if (controller.signal.aborted) return;
        setEntries(page.entries);
        setCursor(page.nextCursor);
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : t("loadError"));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => {
      controller.abort();
      moreRequest.current?.abort();
    };
  }, [filters, revision, t]);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    const current = generation.current;
    const controller = new AbortController();
    moreRequest.current = controller;
    setLoadingMore(true);
    setError(null);
    try {
      const page = await loadActivity({ ...filters, cursor }, controller.signal);
      if (controller.signal.aborted || generation.current !== current) return;
      setEntries((previous) => [...previous, ...page.entries]);
      setCursor(page.nextCursor);
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : t("loadError"));
    } finally {
      if (generation.current === current && !controller.signal.aborted) setLoadingMore(false);
    }
  };

  const labelClass = "mb-1 block text-xs text-[var(--text-muted)]";

  return (
    <>
      <p className="mb-4 text-sm leading-relaxed text-[var(--text-muted)]">{t("hint")}</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setFilters({ ...draft });
        }}
        className="surface mb-5 rounded-[var(--radius-lg)] p-4"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          <label>
            <span className={labelClass}>{t("category")}</span>
            <select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} className={inputClass}>
              <option value="">{t("all")}</option>
              <option value="orders">{t("orders")}</option>
              <option value="admin">{t("admin")}</option>
            </select>
          </label>
          <label>
            <span className={labelClass}>{t("action")}</span>
            <select value={draft.action} onChange={(event) => setDraft({ ...draft, action: event.target.value })} className={inputClass}>
              <option value="">{t("all")}</option>
              {ACTIVITY_ACTIONS.map((action) => <option key={action} value={action}>{t(`actions.${action}`)}</option>)}
            </select>
          </label>
          <label>
            <span className={labelClass}>{t("status")}</span>
            <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })} className={inputClass}>
              <option value="">{t("all")}</option>
              {ACTIVITY_STATUSES.map((status) => <option key={status} value={status}>{t(`statuses.${status}`)}</option>)}
            </select>
          </label>
          <label>
            <span className={labelClass}>{t("username")}</span>
            <input value={draft.username} onChange={(event) => setDraft({ ...draft, username: event.target.value })} maxLength={64} className={inputClass} />
          </label>
          <label>
            <span className={labelClass}>{t("from")}</span>
            <input type="date" value={draft.from} max={draft.to || undefined} onChange={(event) => setDraft({ ...draft, from: event.target.value })} className={inputClass} />
          </label>
          <label>
            <span className={labelClass}>{t("to")}</span>
            <input type="date" value={draft.to} min={draft.from || undefined} onChange={(event) => setDraft({ ...draft, to: event.target.value })} className={inputClass} />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--btn-primary-color)] cursor-pointer">{t("apply")}</button>
          <button type="button" onClick={() => { setDraft(initialFilters); setFilters({ ...initialFilters }); }} className="rounded-full bg-[var(--hover)] px-4 py-2 text-sm cursor-pointer">{t("reset")}</button>
          <button type="button" onClick={() => setRevision((value) => value + 1)} disabled={loading} className="ml-auto inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-[var(--text-muted)] cursor-pointer hover:bg-[var(--hover)] disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
            {t("refresh")}
          </button>
        </div>
      </form>

      <ErrorBanner message={error} />
      {loading ? (
        <p role="status" className="py-8 text-center text-sm text-[var(--text-muted)]">{t("loading")}</p>
      ) : entries.length === 0 ? (
        <p className="surface rounded-[var(--radius-lg)] px-4 py-10 text-center text-sm text-[var(--text-muted)]">{error ? t("loadError") : t("empty")}</p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <article key={entry.id} className="surface rounded-[var(--radius-lg)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="m-0 text-sm font-semibold">{t(`actions.${entry.action}`)}</h2>
                <span className={`rounded-full px-2 py-1 text-[10px] font-medium ${
                  entry.status === "success" ? "bg-green-500/10 text-green-700 dark:text-green-400"
                    : entry.status === "failed" ? "bg-red-500/10 text-red-600 dark:text-red-400"
                      : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                }`}>{t(`statuses.${entry.status}`)}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
                <span className="break-all font-mono">{entry.username}</span>
                <time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString(locale, { timeZone: "Europe/Vilnius" })}</time>
                {entry.target && <span className="break-all">{entry.target}</span>}
              </div>
              {Object.keys(entry.details).length > 0 && <ActivityDetails entry={entry} />}
            </article>
          ))}
        </div>
      )}
      {cursor && !loading && (
        <button type="button" onClick={loadMore} disabled={loadingMore} className="mx-auto mt-5 flex items-center justify-center gap-2 rounded-full border border-[var(--border)] px-5 py-2.5 text-sm cursor-pointer disabled:opacity-50">
          {loadingMore && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {t("more")}
        </button>
      )}
    </>
  );
}
