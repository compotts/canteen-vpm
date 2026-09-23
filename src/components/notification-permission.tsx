"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api/client";

function urlBase64ToArrayBuffer(value: string): ArrayBuffer {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const bytes = new Uint8Array(rawData.length);
  for (let index = 0; index < rawData.length; index += 1) {
    bytes[index] = rawData.charCodeAt(index);
  }
  return bytes.buffer;
}

export function NotificationPermission() {
  const [state, setState] = useState<"idle" | "loading" | "enabled" | "error">(
    "idle"
  );

  async function enableNotifications() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("error");
      return;
    }

    setState("loading");

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("error");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error("Missing public VAPID key");

      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToArrayBuffer(publicKey),
        }));

      await apiFetch("/api/notifications/subscribe", {
        method: "POST",
        body: subscription.toJSON(),
      });

      setState("enabled");
    } catch (error) {
      console.error("Unable to enable Web Push", error);
      setState("error");
    }
  }

  if (state === "enabled") {
    return (
      <p className="text-sm text-[var(--text-muted)]">
        Напоминания о заказе включены.
      </p>
    );
  }

  return (
    <div className="surface rounded-[var(--radius-md)] p-4">
      <p className="text-sm text-[var(--text)] m-0 mb-3">
        Включите уведомления, чтобы не забывать заказывать еду.
      </p>
      <button
        type="button"
        onClick={enableNotifications}
        disabled={state === "loading"}
        className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--btn-primary-color)] disabled:opacity-50"
      >
        {state === "loading" ? "Подключение…" : "Включить уведомления"}
      </button>
      {state === "error" && (
        <p className="mt-2 mb-0 text-sm text-red-600 dark:text-red-400">
          Не удалось включить уведомления. Проверьте разрешение браузера и HTTPS.
        </p>
      )}
    </div>
  );
}