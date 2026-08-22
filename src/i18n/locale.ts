"use server";

import { cookies } from "next/headers";
import { defaultLocale, locales, localeCookie, type Locale } from "./config";

export async function getUserLocale(): Promise<Locale> {
  const value = (await cookies()).get(localeCookie)?.value;
  return locales.includes(value as Locale) ? (value as Locale) : defaultLocale;
}

export async function setUserLocale(locale: Locale): Promise<void> {
  (await cookies()).set(localeCookie, locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
}
