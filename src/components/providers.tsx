"use client";

import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./auth-provider";
import { THEME_STORAGE_KEY } from "@/lib/constants";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey={THEME_STORAGE_KEY}
      disableTransitionOnChange
    >
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
