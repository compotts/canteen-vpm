"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { TriangleAlert } from "lucide-react";
import { apiFetch } from "@/lib/api/client";

type CanteenStatus = {
  ok: boolean;
  reason: "certificate" | "unreachable" | null;
};

export function CanteenStatusBanner() {
  const t = useTranslations();
  const [status, setStatus] = useState<CanteenStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<CanteenStatus>("/api/canteen-status")
      .then((value) => {
        if (!cancelled) setStatus(value);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  if (!status || status.ok) return null;

  return (
    <div className="px-4 md:px-6 pt-3">
      <div
        role="status"
        className="animate-rise max-w-[430px] md:max-w-4xl mx-auto flex items-start gap-2.5 rounded-[var(--radius-md)] border border-amber-500/40 bg-amber-500/10 px-4 py-3"
      >
        <TriangleAlert
          className="w-4 h-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
          aria-hidden="true"
        />
        <p className="m-0 text-sm text-[var(--text)] leading-relaxed">
          {status.reason === "certificate"
            ? t("status.certificate")
            : t("status.unreachable")}
        </p>
      </div>
    </div>
  );
}
