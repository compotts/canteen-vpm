export const ACTIVITY_ACTIONS = [
  "order_submit",
  "history_save",
  "history_update",
  "history_delete",
  "dish_create",
  "dish_update",
  "dish_delete",
  "translation_create",
  "translation_update",
  "translation_delete",
  "update_create",
  "update_edit",
  "update_delete",
  "photo_upload",
  "photo_delete",
  "feedback_delete",
  "admin_create",
  "admin_update",
  "admin_delete",
  "admin_login",
  "admin_logout",
] as const;

export const ACTIVITY_STATUSES = ["success", "failed", "pending", "unknown"] as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];
export type ActivityStatus = (typeof ACTIVITY_STATUSES)[number];
export type ActivityCategory = "orders" | "admin";

export type ActivityEntry = {
  id: string;
  username: string;
  category: ActivityCategory;
  action: ActivityAction;
  status: ActivityStatus;
  target: string | null;
  details: Record<string, unknown>;
  createdAt: string;
};

export type ActivityPage = {
  entries: ActivityEntry[];
  nextCursor: string | null;
};
