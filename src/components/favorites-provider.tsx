"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth, LOGOUT_EVENT } from "./auth-provider";
import { ApiError } from "@/lib/api/client";
import { loadFavorites, saveFavorite } from "@/lib/api/favorites";
import { favoriteKey } from "@/lib/favorites";

type FavoritesValue = {
  keys: ReadonlySet<string>;
  pending: ReadonlySet<string>;
  ready: boolean;
  loading: boolean;
  error: "load" | "save" | null;
  reload: () => void;
  toggle: (name: string) => Promise<void>;
};

const FavoritesContext = createContext<FavoritesValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { isAuth } = useAuth();
  return (
    <FavoritesSession key={isAuth ? "authenticated" : "anonymous"} enabled={isAuth}>
      {children}
    </FavoritesSession>
  );
}

function FavoritesSession({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  const [keys, setKeys] = useState<Set<string>>(() => new Set());
  const [pending, setPending] = useState<Set<string>>(() => new Set());
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<"load" | "save" | null>(null);
  const active = useRef(false);
  const ready = useRef(false);
  const keysRef = useRef(new Set<string>());
  const mutations = useRef(new Map<string, AbortController>());
  const loadRequest = useRef<AbortController | null>(null);
  const version = useRef(0);

  const updateKey = useCallback((key: string, selected: boolean) => {
    const next = new Set(keysRef.current);
    if (selected) next.add(key);
    else next.delete(key);
    keysRef.current = next;
    setKeys(next);
  }, []);

  const fetchList = useCallback(() => {
    if (!enabled || mutations.current.size > 0) return;
    loadRequest.current?.abort();
    const controller = new AbortController();
    loadRequest.current = controller;
    const current = ++version.current;
    ready.current = false;
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    loadFavorites(controller.signal)
      .then((result) => {
        if (!active.current || current !== version.current || controller.signal.aborted) return;
        const next = new Set(result.keys);
        keysRef.current = next;
        ready.current = true;
        setKeys(next);
        setLoaded(true);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (!active.current || current !== version.current) return;
        setLoaded(false);
        setError("load");
        if (cause instanceof ApiError && cause.status === 401) {
          window.dispatchEvent(new Event(LOGOUT_EVENT));
        }
      })
      .finally(() => {
        window.clearTimeout(timeout);
        if (active.current && current === version.current) setLoading(false);
      });
  }, [enabled]);

  const reload = useCallback(() => {
    if (!enabled || mutations.current.size > 0) return;
    setLoading(true);
    setError(null);
    fetchList();
  }, [enabled, fetchList]);

  useEffect(() => {
    active.current = true;
    fetchList();
    const refresh = () => {
      if (document.visibilityState === "visible") reload();
    };
    const requests = mutations.current;
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      active.current = false;
      ready.current = false;
      loadRequest.current?.abort();
      for (const controller of requests.values()) controller.abort();
      requests.clear();
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [fetchList, reload]);

  const toggle = useCallback(async (name: string) => {
    const key = favoriteKey(name);
    if (!enabled || !ready.current || !key || mutations.current.has(key)) return;
    const wasSelected = keysRef.current.has(key);
    const controller = new AbortController();
    mutations.current.set(key, controller);
    setPending(new Set(mutations.current.keys()));
    setError(null);
    updateKey(key, !wasSelected);
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const result = await saveFavorite(name, !wasSelected, controller.signal);
      if (active.current) updateKey(key, result.isFavorite);
    } catch (cause) {
      if (!active.current) return;
      updateKey(key, wasSelected);
      setError("save");
      if (cause instanceof ApiError && cause.status === 401) {
        window.dispatchEvent(new Event(LOGOUT_EVENT));
      }
    } finally {
      window.clearTimeout(timeout);
      mutations.current.delete(key);
      if (active.current) setPending(new Set(mutations.current.keys()));
    }
  }, [enabled, updateKey]);

  return (
    <FavoritesContext.Provider value={{ keys, pending, ready: enabled && loaded && !loading, loading, error, reload, toggle }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesValue {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites must be used inside <FavoritesProvider>");
  return context;
}
