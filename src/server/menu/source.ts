import { parseHTML } from "linkedom";
import { z } from "zod";
import {
  parseMenuDocument,
  parseOrderMakeDocument,
} from "@/lib/valgykla/parse";
import { parseValgyklaProfile } from "@/server/valgykla-identity";
import { HttpError } from "@/server/http";
import type { Menu, OrderLink } from "@/lib/valgykla/types";
import type { ArchivedMenuSection } from "@/lib/menu-archive";

function originUrl(): string {
  return process.env.VALGYKLA_ORIGIN ?? "https://valgykla.vpm.lt";
}

function documentFromHtml(html: string): Document {
  return parseHTML(html).document as unknown as Document;
}

export function menuLinkFromHtml(html: string): OrderLink | null {
  const doc = documentFromHtml(html);
  if (doc.querySelector('input[type="password"]'))
    throw new HttpError(401, "canteen session expired");
  const link = parseOrderMakeDocument(doc);
  if (link && !z.iso.date().safeParse(link.date).success)
    throw new HttpError(502, "invalid menu date");
  return link;
}

export function archiveSections(
  html: string,
  date: string,
): ArchivedMenuSection[] {
  const doc = documentFromHtml(html);
  if (doc.querySelector('input[type="password"]'))
    throw new HttpError(401, "canteen session expired");
  const reportedDate = doc
    .querySelector("h2")
    ?.textContent?.match(/\((\d{4}-\d{2}-\d{2})\)/)?.[1];
  if (reportedDate && reportedDate !== date)
    throw new HttpError(502, "menu date mismatch");
  const parsed: Menu = parseMenuDocument(doc, date);
  const ids = new Set<number>();
  const sections = parsed.sections
    .map((section) => ({
      title: section.title,
      items: section.items.map((item) => {
        if (
          !item.name ||
          !Number.isSafeInteger(item.id) ||
          item.id <= 0 ||
          ids.has(item.id) ||
          !Number.isFinite(item.price) ||
          item.price < 0
        )
          throw new HttpError(502, "invalid menu item");
        ids.add(item.id);
        return {
          id: item.id,
          name: item.name,
          price: item.price,
          weight: item.weight ?? "",
        };
      }),
    }))
    .filter((section) => section.items.length > 0);
  const inputCount = doc.querySelectorAll(
    "form .container .form-control table tbody input[name^='quantities[']",
  ).length;
  if (!ids.size || ids.size > 500 || inputCount !== ids.size)
    throw new HttpError(502, "empty or invalid menu");
  return sections;
}

export async function getAvailableMenuLink(
  sessionId: string,
): Promise<OrderLink | null> {
  const response = await fetch(`${originUrl()}/orders/make`, {
    headers: { cookie: `PHPSESSID=${sessionId}` },
    redirect: "manual",
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if ([301, 302, 303, 307, 308, 401, 403].includes(response.status)) {
    throw new HttpError(401, "canteen session expired");
  }
  if (!response.ok) throw new HttpError(503, "canteen unavailable");
  return menuLinkFromHtml(await response.text());
}

export async function createMenuSourceSession(): Promise<{
  sessionId: string;
  get: (path: string) => Promise<string>;
}> {
  const username = process.env.MENU_SYNC_USERNAME;
  const password = process.env.MENU_SYNC_PASSWORD;
  if (!username || !password)
    throw new HttpError(503, "menu sync credentials not configured");
  const origin = originUrl();
  const deadline = AbortSignal.timeout(22000);
  let sessionId = "";
  const request = async (
    path: string,
    options: RequestInit = {},
  ): Promise<string> => {
    let url = new URL(path, origin);
    let method = options.method ?? "GET";
    let body = options.body;
    for (let redirect = 0; redirect < 5; redirect += 1) {
      if (url.origin !== new URL(origin).origin)
        throw new HttpError(502, "unexpected canteen redirect");
      const response = await fetch(url, {
        method,
        body,
        headers: {
          ...(method === "POST"
            ? { "Content-Type": "application/x-www-form-urlencoded" }
            : {}),
          ...(sessionId ? { cookie: `PHPSESSID=${sessionId}` } : {}),
        },
        redirect: "manual",
        cache: "no-store",
        signal: AbortSignal.any([deadline, AbortSignal.timeout(8000)]),
      });
      for (const cookie of response.headers.getSetCookie()) {
        const match = cookie.match(/(?:^|,\s*)PHPSESSID=([^;\s,]+)/);
        if (match) sessionId = match[1];
      }
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) throw new HttpError(502, "missing canteen redirect");
        url = new URL(location, url);
        if ([301, 302, 303].includes(response.status)) {
          method = "GET";
          body = undefined;
        }
        await response.body?.cancel();
        continue;
      }
      if (!response.ok) throw new HttpError(503, "canteen unavailable");
      return response.text();
    }
    throw new HttpError(502, "too many canteen redirects");
  };
  await request("/login");
  await request("/login", {
    method: "POST",
    body: new URLSearchParams({ username, password }),
  });
  const profile = parseValgyklaProfile(await request("/"));
  if (
    !sessionId ||
    !profile ||
    profile.username.toLowerCase() !== username.trim().toLowerCase()
  ) {
    throw new HttpError(401, "menu sync login failed");
  }
  return { sessionId, get: (path) => request(path) };
}

export async function getSessionMenu(
  sessionId: string,
  date: string,
): Promise<Menu> {
  const response = await fetch(`${originUrl()}/orders/make/${date}`, {
    headers: { cookie: `PHPSESSID=${sessionId}` },
    redirect: "manual",
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if ([301, 302, 303, 307, 308, 401, 403].includes(response.status))
    throw new HttpError(401, "canteen session expired");
  if (!response.ok) throw new HttpError(503, "canteen unavailable");
  const html = await response.text();
  archiveSections(html, date);
  return parseMenuDocument(documentFromHtml(html), date);
}
