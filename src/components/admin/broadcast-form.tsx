"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Bell, Send } from "lucide-react";
import { ApiError, apiFetch } from "@/lib/api/client";
import type { BroadcastInput, BroadcastResult } from "@/lib/broadcast";
import { ErrorBanner } from "./error-banner";

export function BroadcastForm() {
  const t = useTranslations("admin.broadcast");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const input = useRef<BroadcastInput | null>(null);
  const busy = useRef(false);
  const [locked, setLocked] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy.current || result?.state === "complete") return;
    const request = input.current ?? {
      id: crypto.randomUUID(),
      title: title.trim(),
      body: body.trim(),
    };
    if (!request.title || !request.body) return;
    input.current = request;
    busy.current = true;
    setLocked(true);
    setSending(true);
    setError(null);
    try {
      const response = await apiFetch<BroadcastResult>("/api/admin/broadcast", {
        method: "POST",
        body: request,
        signal: AbortSignal.timeout(65000),
      });
      setResult(response);
    } catch (cause) {
      if (
        cause instanceof ApiError &&
        cause.details?.code === "push_not_configured"
      ) {
        setError(t("notConfigured"));
        setLocked(false);
        input.current = null;
      } else if (
        cause instanceof ApiError &&
        [400, 401, 403, 409].includes(cause.status)
      ) {
        setError(
          t(
            cause.status === 401 || cause.status === 403
              ? "forbidden"
              : "invalid",
          ),
        );
        setLocked(false);
        input.current = null;
      } else {
        setError(t("unknown"));
      }
    } finally {
      busy.current = false;
      setSending(false);
    }
  };

  const reset = () => {
    if (busy.current) return;
    input.current = null;
    setTitle("");
    setBody("");
    setResult(null);
    setError(null);
    setLocked(false);
  };

  return (
    <form
      onSubmit={submit}
      className="surface rounded-[var(--radius-lg)] p-4 mb-6 space-y-4"
    >
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Bell size={20} aria-hidden="true" />
        {t("title")}
      </h2>
      <p className="text-sm text-[var(--text-muted)]">{t("hint")}</p>
      <label className="block text-sm font-medium">
        {t("heading")}
        <input
          required
          maxLength={80}
          value={title}
          disabled={locked}
          onChange={(event) => setTitle(event.target.value)}
          className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text)] disabled:opacity-60"
        />
      </label>
      <label className="block text-sm font-medium">
        {t("body")}
        <textarea
          required
          maxLength={500}
          value={body}
          disabled={locked}
          onChange={(event) => setBody(event.target.value)}
          className="mt-2 min-h-24 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-[var(--text)] disabled:opacity-60"
        />
      </label>
      <ErrorBanner message={error} />
      {result && (
        <div
          role="status"
          className="rounded-lg border border-[var(--border)] p-3 text-sm leading-relaxed"
        >
          {result.state === "pending"
            ? t("pending")
            : t("result", {
                total: result.total,
                sent: result.sent,
                failed: result.failed,
                expired: result.expired,
              })}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {result?.state !== "complete" && (
          <button
            type="submit"
            disabled={sending || !title.trim() || !body.trim()}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--btn-primary-color)] disabled:opacity-50"
          >
            <Send size={16} aria-hidden="true" />
            {t(sending ? "sending" : locked ? "check" : "send")}
          </button>
        )}
        {locked && (
          <button
            type="button"
            onClick={reset}
            disabled={sending}
            className="min-h-11 rounded-full border border-[var(--border)] px-4 py-2 text-sm disabled:opacity-50"
          >
            {t("new")}
          </button>
        )}
      </div>
    </form>
  );
}
