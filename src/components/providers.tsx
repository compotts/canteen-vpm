"use client";

import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./auth-provider";
import { AdminSessionProvider } from "./admin-session-provider";
import { FavoritesProvider } from "./favorites-provider";
import { THEME_STORAGE_KEY } from "@/lib/constants";
import { THEMES } from "@/lib/themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      enableColorScheme={false}
      themes={THEMES}
      storageKey={THEME_STORAGE_KEY}
      disableTransitionOnChange
    >
      <AuthProvider>
        <FavoritesProvider>
          <AdminSessionProvider>{children}</AdminSessionProvider>
        </FavoritesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
