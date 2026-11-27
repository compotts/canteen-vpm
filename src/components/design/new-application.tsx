"use client";

import { useAuth } from "@/components/auth-provider";
import { LoginForm } from "@/components/auth/login-form";
import { LoadingScreen } from "@/components/loading-screen";
import { CanteenApp } from "./canteen-app";

export function NewApplication() {
  const { isAuth, isChecking } = useAuth();
  if (isChecking) return <LoadingScreen />;
  return isAuth ? <CanteenApp /> : <LoginForm />;
}
