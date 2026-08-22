"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { getAdminSession } from "@/lib/api/admin";
import { useAuth } from "./auth-provider";
import type { AdminPermission, AdminSessionInfo } from "@/types/api";

type AdminSessionValue = {
  session: AdminSessionInfo | null;
  isAdmin: boolean;
  isOwner: boolean;
  ready: boolean;
  can: (permission: AdminPermission) => boolean;
  refresh: () => Promise<void>;
};

const AdminSessionContext = createContext<AdminSessionValue | null>(null);

async function loadSession(enabled: boolean): Promise<AdminSessionInfo | null> {
  if (!enabled) return null;
  try {
    return await getAdminSession();
  } catch {
    return null;
  }
}

export function AdminSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuth } = useAuth();
  const [state, setState] = useState<{
    session: AdminSessionInfo | null;
    ready: boolean;
  }>({ session: null, ready: false });

  useEffect(() => {
    let cancelled = false;
    loadSession(isAuth).then((session) => {
      if (!cancelled) setState({ session, ready: true });
    });
    return () => {
      cancelled = true;
    };
  }, [isAuth]);

  const refresh = useCallback(async () => {
    const session = await loadSession(true);
    setState({ session, ready: true });
  }, []);

  const session = state.session;
  const can = useCallback(
    (permission: AdminPermission) =>
      Boolean(session?.permissions.includes(permission)),
    [session]
  );

  return (
    <AdminSessionContext.Provider
      value={{
        session,
        isAdmin: session !== null,
        isOwner: Boolean(session?.isOwner),
        ready: state.ready,
        can,
        refresh,
      }}
    >
      {children}
    </AdminSessionContext.Provider>
  );
}

export function useAdminSession(): AdminSessionValue {
  const context = useContext(AdminSessionContext);
  if (!context) {
    throw new Error("useAdminSession must be used inside <AdminSessionProvider>");
  }
  return context;
}
