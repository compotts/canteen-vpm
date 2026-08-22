"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";
import { LoadingScreen } from "./loading-screen";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuth, isChecking } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isChecking && !isAuth) router.replace("/");
  }, [isAuth, isChecking, router]);

  if (isChecking || !isAuth) return <LoadingScreen />;
  return <>{children}</>;
}
