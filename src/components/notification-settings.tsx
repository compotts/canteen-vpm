"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api/client";

function urlBase64ToArrayBuffer(value: string): ArrayBuffer {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const bytes = Uint8Array.from(rawData, (char) => char.charCodeAt(0));

  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
}


export function NotificationSettings() {
  const locale = useLocale();
  const t = useTranslations("notifications");
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadState() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        if (!cancelled) setLoading(false);
        return;
      }
      const registration = await navigator.serviceWorker.getRegistration("/sw.js");
      const subscription = await registration?.pushManager.getSubscription();
      if (!cancelled) {
        setEnabled(Boolean(subscription && Notification.permission === "granted"));
        setLoading(false);
      }
    }
    loadState().catch(() => {
      if (!cancelled) {
        setError(true);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function setNotifications(nextEnabled: boolean) {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setError(true);
      return;
    }

    setLoading(true);
    setError(false);

    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const current = await registration.pushManager.getSubscription();

      if (!nextEnabled) {
        if (current) {
          await apiFetch("/api/notifications/subscribe", {
            method: "DELETE",
            body: { endpoint: current.endpoint },
          });
          await current.unsubscribe();
        }
        setEnabled(false);
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError(true);
        return;
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error("Missing public VAPID key");

      const subscription =
        current ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToArrayBuffer(publicKey),
        }));

      await apiFetch("/api/notifications/subscribe", {
        method: "POST",
        body: { ...subscription.toJSON(), locale },
      });

      setEnabled(true);
    } catch (error) {
      console.error("Unable to enable Web Push", error);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="py-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="m-0 text-sm font-medium text-[var(--text)]">
            {t("title")}
          </p>
          <p className="m-0 mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
            {t("howItWorks")}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={enabled ? t("disable") : t("enable")}
          onClick={() => setNotifications(!enabled)}
          disabled={loading}
          className={`relative h-7 w-12 shrink-0 rounded-full border-0 transition-colors disabled:opacity-50 ${
            enabled ? "bg-[var(--accent)]" : "bg-[var(--border-subtle)]"
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
      {error && (
        <p className="mt-2 mb-0 text-sm text-red-600 dark:text-red-400">
          {t("error")}
        </p>
      )}
    </div>
  );
}