import type { Metadata, Viewport } from "next";
import { Lora, Manrope, Plus_Jakarta_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import "./globals.css";
import "./design/design.css";
import "./design/login.css";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/app-shell";
import { APP_DESCRIPTION, APP_NAME, APP_SHORT_NAME } from "@/lib/app-metadata";

const manrope = Manrope({
  variable: "--font-design-sans",
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
});
const lora = Lora({
  variable: "--font-design-heading",
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  openGraph: {
    type: "website",
    title: APP_NAME,
    description: APP_DESCRIPTION,
    siteName: APP_NAME,
  },
  twitter: {
    card: "summary",
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },
  appleWebApp: {
    capable: true,
    title: APP_SHORT_NAME,
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.webp", sizes: "192x192", type: "image/webp" },
      { url: "/icons/icon-512.webp", sizes: "512x512", type: "image/webp" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f5" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${jakarta.variable} ${manrope.variable} ${lora.variable} antialiased`}
    >
      <body>
        <NextIntlClientProvider>
          <Providers>
            <AppShell>{children}</AppShell>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
