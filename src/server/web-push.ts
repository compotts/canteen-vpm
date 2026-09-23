import webpush from "web-push";

let configured = false;

function configureWebPush( ): void {
  if (configured) return;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    throw new Error("Web Push VAPID environment variables are missing");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export type PushSubscriptionData = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export async function sendWebPush(
  subscription: PushSubscriptionData,
  payload: { title: string; body: string; url: string; tag: string }
): Promise<void> {
  configureWebPush();
  await webpush.sendNotification(subscription, JSON.stringify(payload), {
    TTL: 60 * 60 * 12,
  });
}

export function isExpiredPushSubscription(error: unknown): boolean {
  const statusCode =
    typeof error === "object" && error !== null && "statusCode" in error
      ? Number((error as { statusCode?: unknown }).statusCode)
      : 0;

  return statusCode === 404 || statusCode === 410;
}