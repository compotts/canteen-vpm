import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { checkAuth } from "../services/valgykla.js";
import { getStoredUsername } from "../services/userStorage.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuth, setAuthState] = useState(false);
  const [isChecking, setChecking] = useState(true);
  const setAuth = useCallback((v) => setAuthState(v), []);
  const logout = useCallback(() => setAuthState(false), []);

  useEffect(() => {
    const h = () => setAuthState(false);
    window.addEventListener("auth:logout", h);
    return () => window.removeEventListener("auth:logout", h);
  }, []);

  useEffect(() => {
    let cancelled = false;
    checkAuth()
      .then(() => { if (!cancelled) setAuthState(true); })
      .catch(() => { if (!cancelled) setAuthState(false); })
      .finally(() => { if (!cancelled) setChecking(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isAuth) return undefined;

    const initialUsername = getStoredUsername();
    const forceLogout = () => {
      setAuthState(false);
      window.dispatchEvent(new Event("auth:logout"));
    };

    const checkTamper = () => {
      const current = getStoredUsername();
      if (current !== initialUsername) {
        forceLogout();
      }
    };

    const timer = window.setInterval(checkTamper, 1000);
    const onStorage = () => checkTamper();
    window.addEventListener("storage", onStorage);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", onStorage);
    };
  }, [isAuth]);

  return (
    <AuthContext.Provider value={{ isAuth, isChecking, logout, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
