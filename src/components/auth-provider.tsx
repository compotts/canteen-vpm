"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { checkAuth } from "@/lib/valgykla/client";
import { getStoredUsername } from "@/lib/user-storage";

export const LOGOUT_EVENT = "auth:logout";

type AuthValue = {
  isAuth: boolean;
  isChecking: boolean;
  setAuth: (value: boolean) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuth, setAuth] = useState(false);
  const [isChecking, setChecking] = useState(true);

  const logout = useCallback(() => setAuth(false), []);

  useEffect(() => {
    const handler = () => setAuth(false);
    window.addEventListener(LOGOUT_EVENT, handler);
    return () => window.removeEventListener(LOGOUT_EVENT, handler);
  }, []);

  useEffect(() => {
    let cancelled = false;

    checkAuth()
      .then(() => {
        if (!cancelled) setAuth(true);
      })
      .catch(() => {
        if (!cancelled) setAuth(false);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isAuth) return;

    const initialUsername = getStoredUsername();
    const checkTamper = () => {
      if (getStoredUsername() !== initialUsername) {
        setAuth(false);
        window.dispatchEvent(new Event(LOGOUT_EVENT));
      }
    };

    const timer = window.setInterval(checkTamper, 1000);
    window.addEventListener("storage", checkTamper);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", checkTamper);
    };
  }, [isAuth]);

  return (
    <AuthContext.Provider value={{ isAuth, isChecking, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
