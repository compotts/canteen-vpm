"use client";

import { useAuth } from "@/components/auth-provider";
import { LoadingScreen } from "@/components/loading-screen";
import { LoginForm } from "@/components/auth/login-form";
import { HomeView } from "./home-view";
import type { AppUpdate } from "@/types/api";

export function HomeOrLogin({ updates }: { updates: AppUpdate[] }) {
  const { isAuth, isChecking } = useAuth();

  if (isChecking) return <LoadingScreen />;
  return isAuth ? <HomeView updates={updates} /> : <LoginForm />;
}
