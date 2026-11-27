import { z } from "zod";

export const broadcastSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1).max(80),
  body: z.string().trim().min(1).max(500),
});

export type BroadcastInput = z.infer<typeof broadcastSchema>;

export type BroadcastResult = {
  id: string;
  state: "complete" | "pending";
  total: number;
  sent: number;
  failed: number;
  expired: number;
};
