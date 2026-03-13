import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import i18n from "i18next";
import { DEFAULT_LANG } from "./constants.js";
import { AuthProvider, useAuth } from "./contexts/AuthContext.jsx";
import Header from "./components/Header.jsx";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import Catalog from "./pages/Catalog.jsx";
import Order from "./pages/Order.jsx";
import History from "./pages/History.jsx";

function ProtectedRoute({ children }) {
  const { isAuth } = useAuth();
  if (!isAuth) return <Navigate to="/" replace />;
  return children;
}

function HomeOrLogin() {
  const { isAuth, isChecking } = useAuth();
  const { t } = useTranslation();
  if (isChecking) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-[var(--text-muted)]">{t("common.loading")}</p>
      </div>
    );
  }
  return isAuth ? <Home /> : <Login />;
}

function AppRoutes() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <Routes>
          <Route path="/" element={<HomeOrLogin />} />
          <Route path="/menu" element={<ProtectedRoute><Catalog /></ProtectedRoute>} />
          <Route path="/order" element={<ProtectedRoute><Order /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
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
    i18n.on("languageChanged", onLangChange);
    return () => i18n.off("languageChanged", onLangChange);
  }, []);
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
