import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import i18n from 'i18next';
import { DEFAULT_LANG } from './constants.js';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { Header } from './components/Header.jsx';
import { Login } from './pages/Login.jsx';
import { Catalog } from './pages/Catalog.jsx';

function ProtectedRoute({ children }) {
  const { isAuth } = useAuth();
  if (!isAuth) return <Navigate to="/" replace />;
  return children;
}

function PublicOnlyRoute({ children }) {
  const { isAuth } = useAuth();
  if (isAuth) return <Navigate to="/menu" replace />;
  return children;
}

function AppRoutes() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <Routes>
          <Route path="/" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/menu" element={<ProtectedRoute><Catalog /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  useEffect(() => {
    document.documentElement.lang = i18n.language || DEFAULT_LANG;
    const onLangChange = (lng) => { document.documentElement.lang = lng || DEFAULT_LANG; };
    i18n.on('languageChanged', onLangChange);
    return () => i18n.off('languageChanged', onLangChange);
  }, []);
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
