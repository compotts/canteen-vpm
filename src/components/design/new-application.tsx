"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { isDarkTheme } from "@/lib/themes";
import { useAuth } from "@/components/auth-provider";
import { LoginForm } from "@/components/auth/login-form";
import { LoadingScreen } from "@/components/loading-screen";
import { CanteenApp } from "./canteen-app";

export function NewApplication() {
  const { isAuth, isChecking } = useAuth();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const entries = Array.from(
      document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'),
    );
    const original = entries.map((entry) => entry.content);
    const color = isDarkTheme(resolvedTheme) ? "#121b1f" : "#f8f4ed";
    entries.forEach((entry) => {
      entry.content = color;
    });
    return () => {
      entries.forEach((entry, index) => {
        entry.content = original[index];
      });
    };
  }, [resolvedTheme]);

  if (isChecking) return <LoadingScreen />;
  return isAuth ? <CanteenApp /> : <LoginForm />;
}
