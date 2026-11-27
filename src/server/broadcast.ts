import { isExpiredPushSubscription, sendWebPush } from "./web-push";
import type { BroadcastInput } from "@/lib/broadcast";

type Recipient = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function deliverBroadcast(
  recipients: Recipient[],
  input: BroadcastInput,
) {
  const deadline = Date.now() + 40000;
  const expiredIds: string[] = [];
  let next = 0;
  let sent = 0;
  let failed = 0;
  const payload = {
    title: input.title,
    body: input.body,
    url: "/",
    tag: `broadcast-${input.id}`,
  };

  async function worker() {
    while (next < recipients.length && Date.now() < deadline) {
      const recipient = recipients[next++];
      try {
        await sendWebPush(
          {
            endpoint: recipient.endpoint,
            keys: { p256dh: recipient.p256dh, auth: recipient.auth },
          },
          payload,
        );
        sent += 1;
      } catch (error) {
        if (isExpiredPushSubscription(error)) expiredIds.push(recipient.id);
        else failed += 1;
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(10, recipients.length) }, worker),
  );
  failed += recipients.length - next;
  return {
    total: recipients.length,
    sent,
    failed,
    expired: expiredIds.length,
    expiredIds,
  };
}
