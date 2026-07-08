import { useRef } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home, UtensilsCrossed, ShoppingCart, History, Shield } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { isStoredUserAdmin } from "../services/userStorage.js";
import useLiquidLens from "../hooks/useLiquidLens.js";

export default function BottomTabBar() {
  const { isAuth } = useAuth();
  if (!isAuth) return null;
  return <TabBarPill />;
}

function TabBarPill() {
  const { t } = useTranslation();
  const pillRef = useRef(null);
  useLiquidLens(pillRef);

  const isAdmin = isStoredUserAdmin();

  const tabs = [
    { to: "/", icon: Home, label: t("nav.home"), end: true },
    { to: "/menu", icon: UtensilsCrossed, label: t("nav.catalog") },
    { to: "/order", icon: ShoppingCart, label: t("nav.order") },
    { to: "/history", icon: History, label: t("nav.history") },
    ...(isAdmin ? [{ to: "/admin", icon: Shield, label: t("nav.adminShort") }] : []),
  ];

  return (
    <nav
      className="md:hidden fixed inset-x-0 bottom-0 z-[900] flex justify-center pointer-events-none px-4"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      aria-label={t("nav.catalog")}
    >
      <div ref={pillRef} className="glass-strong pointer-events-auto rounded-full p-1.5 max-w-full">
        <div className="flex items-stretch gap-1 rounded-full overflow-x-auto no-scrollbar">
          {tabs.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 rounded-full px-3 py-1.5 min-w-[54px] whitespace-nowrap transition-all active:scale-95 ${
                  isActive
                    ? "bg-[var(--accent)] text-[var(--btn-primary-color)] shadow-sm"
                    : "text-[var(--text-muted)]"
                }`
              }
            >
              <Icon className="w-[22px] h-[22px]" aria-hidden="true" />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
