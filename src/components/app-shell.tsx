"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useInterfaceDesign } from "./use-interface-design";
import { LoadingScreen } from "./loading-screen";
import { legacyPath, rememberInterface } from "@/lib/interface";
import { NewApplication } from "./design/new-application";
import { Header } from "./header";
import { BottomTabBar } from "./bottom-tab-bar";
import { CanteenStatusBanner } from "./canteen-status-banner";
import { PageTransition } from "./page-transition";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const design = useInterfaceDesign();

  const router = useRouter();
  const modern = ["/", "/order", "/history", "/daily-menu"].includes(pathname);
  useEffect(() => {
    if (pathname.startsWith("/old-design")) rememberInterface("old");
  }, [pathname]);

  useEffect(() => {
    if (modern && design === "old") {
      rememberInterface("old");
      router.replace(
        legacyPath(pathname === "/daily-menu" ? "/order" : pathname),
      );
    }
  }, [pathname, modern, router, design]);

  if (modern) return design === "old" ? <LoadingScreen /> : <NewApplication />;

  return (
    <>
      <Header />
      <CanteenStatusBanner />
      <main className="flex flex-1 flex-col pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <PageTransition>{children}</PageTransition>
      </main>
      <BottomTabBar />
    </>
  );
}
