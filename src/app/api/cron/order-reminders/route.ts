import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db";
import {
  orderHistory,
  sentOrderReminders,
  webPushSubscriptions,
} from "@/server/db/schema";
import { isExpiredPushSubscription, sendWebPush } from "@/server/web-push";
import { localeTags, type Locale } from "@/i18n/config";
import ltMessages from "../../../../../messages/lt.json";
import ruMessages from "../../../../../messages/ru.json";
import enMessages from "../../../../../messages/en.json";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TIME_ZONE = "Europe/Vilnius";
const CRON_HOURS = new Set([8, 20]);

type ReminderKind = "morning" | "evening";

type LocalParts = {
  date: string;
  hour: number;
  weekday: number;
};

function getLocalParts(now = new Date()): LocalParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  const date = `${values.year}-${values.month}-${values.day}`;
  const hour = Number(values.hour);
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();

  return { date, hour, weekday };
}

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function getTargetDate(parts: LocalParts): string | null {
  if (parts.hour === 8) {
    return parts.weekday >= 1 && parts.weekday <= 5 ? parts.date : null;
  }

  if (parts.hour === 20) {
    if (parts.weekday >= 1 && parts.weekday <= 4) {
      return addDays(parts.date, 1);
    }
    if (parts.weekday === 5) {
      return addDays(parts.date, 3);
    }
  }

  return null;
}

function getReminderKind(hour: number): ReminderKind | null {
  if (hour === 8) return "morning";
  if (hour === 20) return "evening";
  return null;
}

function isCronAuthorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  return request.headers.get("authorization") === `Bearer ${expected}`;
}

const notificationMessages = {
  lt: ltMessages.notifications,
  ru: ruMessages.notifications,
  en: enMessages.notifications,
} satisfies Record<Locale, {
  pushTitle: string;
  pushEvening: string;
  pushMorning: string;
}>;

function notificationText(
  locale: Locale,
  kind: ReminderKind,
  targetDate: string
) {
  const languageTag = localeTags[locale];
  const dayText = new Intl.DateTimeFormat(languageTag, {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${targetDate}T12:00:00Z`));

  const message = notificationMessages[locale];

  return {
    title: message.pushTitle,
    body: (kind === "evening" ? message.pushEvening : message.pushMorning).replace(
      "{day}",
      dayText
    ),
    url: "/order",
    tag: `order-reminder-${targetDate}`,
  };
}

export async function GET(request: Request): Promise<Response> {
  if (!isCronAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parts = getLocalParts();
  if (!CRON_HOURS.has(parts.hour)) {
    return Response.json({ ok: true, skipped: "outside reminder hour" });
  }

  const targetDate = getTargetDate(parts);
  const reminderKind = getReminderKind(parts.hour);
  if (!targetDate || !reminderKind) {
    return Response.json({ ok: true, skipped: "no menu day" });
  }

  const subscriptions = await db
    .select()
    .from(webPushSubscriptions)
    .where(eq(webPushSubscriptions.enabled, true));

  if (subscriptions.length === 0) {
    return Response.json({ ok: true, targetDate, sent: 0 });
  }

  const usernames = [...new Set(subscriptions.map((item) => item.username))];
  const orders = await db
    .select({ username: orderHistory.username })
    .from(orderHistory)
    .where(
      and(
        eq(orderHistory.menuDate, targetDate),
        inArray(orderHistory.username, usernames)
      )
    );
  const orderedUsers = new Set(orders.map((item) => item.username));
  const subscriptionsByUser = new Map<string, typeof subscriptions>();

  for (const subscription of subscriptions) {
    const current = subscriptionsByUser.get(subscription.username) ?? [];
    current.push(subscription);
    subscriptionsByUser.set(subscription.username, current);
  }

  let sent = 0;
  let skippedOrdered = 0;
  let expired = 0;

  for (const [username, userSubscriptions] of subscriptionsByUser) {
    if (orderedUsers.has(username)) {
      skippedOrdered += 1;
      continue;
    }

    const [claim] = await db
      .insert(sentOrderReminders)
      .values({ username, menuDate: targetDate, reminderKind })
      .onConflictDoNothing({
        target: [
          sentOrderReminders.username,
          sentOrderReminders.menuDate,
          sentOrderReminders.reminderKind,
        ],
      })
      .returning({ id: sentOrderReminders.id });

    if (!claim) continue;

    for (const subscription of userSubscriptions) {
      try {
        await sendWebPush(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          notificationText(subscription.locale as Locale, reminderKind, targetDate)
        );
        sent += 1;
      } catch (error) {
        if (isExpiredPushSubscription(error)) {
          expired += 1;
          await db
            .delete(webPushSubscriptions)
            .where(eq(webPushSubscriptions.id, subscription.id));
        } else {
          console.error("Web Push send failed", {
            username,
            endpoint: subscription.endpoint,
            error,
          });
        }
      }
    }
  }

  return Response.json({
    ok: true,
    targetDate,
    reminderKind,
    sent,
    skippedOrdered,
    expired,
  });
}