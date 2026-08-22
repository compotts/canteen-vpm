"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  History,
  Home,
  Shield,
  ShoppingCart,
  UtensilsCrossed,
} from "lucide-react";
import { useAuth } from "./auth-provider";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useLiquidLens } from "@/hooks/use-liquid-lens";

export function BottomTabBar() {
  const { isAuth } = useAuth();
  if (!isAuth) return null;
  return <TabBarPill />;
}

function TabBarPill() {
  const t = useTranslations();
  const pathname = usePathname();
  const pillRef = useRef<HTMLDivElement>(null);
  useLiquidLens(pillRef);

  const { isAdmin } = useIsAdmin();

  const tabs = [
    { href: "/", icon: Home, label: t("nav.home"), exact: true },
    { href: "/menu", icon: UtensilsCrossed, label: t("nav.catalog") },
    { href: "/order", icon: ShoppingCart, label: t("nav.order") },
    { href: "/history", icon: History, label: t("nav.history") },
    ...(isAdmin
      ? [{ href: "/admin", icon: Shield, label: t("nav.adminShort") }]
      : []),
  ];

  return (
    <nav
      className="md:hidden fixed inset-x-0 bottom-0 z-[900] flex justify-center pointer-events-none px-4"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      aria-label={t("nav.catalog")}
    >
      <div
        ref={pillRef}
        className="glass-strong pointer-events-auto rounded-full p-1.5 max-w-full"
      >
        <div className="flex items-stretch gap-1 rounded-full overflow-x-auto no-scrollbar">
          {tabs.map(({ href, icon: Icon, label, exact }) => {
            const isActive = exact
              ? pathname === href
              : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center gap-0.5 rounded-full px-3 py-1.5 min-w-[54px] whitespace-nowrap transition-all active:scale-95 ${
                  isActive
                    ? "bg-[var(--accent)] text-[var(--btn-primary-color)] shadow-sm"
                    : "text-[var(--text-muted)]"
                }`}
              >
                <Icon className="w-[22px] h-[22px]" aria-hidden="true" />
                <span className="text-[10px] font-medium leading-none">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
