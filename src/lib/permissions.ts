export const ADMIN_PERMISSIONS = [
  "updates",
  "translations",
  "dishes",
  "photos",
  "feedback",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];
