import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getAccessToken, clearAccessToken } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuth, setAuthState] = useState(!!getAccessToken());
  const setAuth = useCallback((v) => setAuthState(v), []);
  const logout = useCallback(() => {
    clearAccessToken();
    setAuthState(false);
  }, []);

  useEffect(() => {
    const h = () => setAuthState(false);
    window.addEventListener('auth:logout', h);
    return () => window.removeEventListener('auth:logout', h);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuth, logout, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth only inside AuthProvider');
  return ctx;
}
