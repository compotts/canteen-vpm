"use client";

import { useSyncExternalStore } from "react";
import { isStoredUserAdmin } from "@/lib/user-storage";

const NEVER_UNSUBSCRIBE = () => {};
const subscribeNever = () => NEVER_UNSUBSCRIBE;
const alwaysTrue = () => true;
const alwaysFalse = () => false;

function subscribeToStorage(onStoreChange: () => void): () => void {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

export function useIsAdmin(): { isAdmin: boolean; ready: boolean } {
  const isAdmin = useSyncExternalStore(
    subscribeToStorage,
    isStoredUserAdmin,
    alwaysFalse
  );
  const ready = useSyncExternalStore(subscribeNever, alwaysTrue, alwaysFalse);

  return { isAdmin, ready };
}
