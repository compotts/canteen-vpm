"use client";

import { useCallback, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { INTERFACE_KEY, type InterfaceDesign } from "@/lib/interface";

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener("interface-change", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("interface-change", listener);
  };
}

export function useInterfaceDesign(): InterfaceDesign {
  const pathname = usePathname();
  const fallback = pathname.startsWith("/old-design") ? "old" : "new";
  const read = useCallback(() => {
    try {
      const value = localStorage.getItem(INTERFACE_KEY);
      return value === "old" || value === "new" ? value : fallback;
    } catch {
      return fallback;
    }
  }, [fallback]);
  return useSyncExternalStore(subscribe, read, () => fallback);
}
