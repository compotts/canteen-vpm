export type { OrderItem } from "@/server/db/schema";

export type Dish = {
  id: string;
  category: string;
  name: string;
  nameRu: string | null;
  nameEn: string | null;
  weight: string | null;
  priceStudent: number | null;
  priceTeacher: number | null;
  photoUrl: string | null;
};

export type Translation = {
  id: number;
  name: string;
  nameRu: string | null;
  nameEn: string | null;
  photoUrl: string | null;
};

export type UpdateText = {
  lt: string;
  ru: string;
  en: string;
};

export type AppUpdate = {
  id: string;
  username: string;
  version: string | null;
  dateLabel: string | null;
  emoji: string | null;
  createdAt: string;
  updatedAt: string;
  text: UpdateText;
};

export type FeedbackEntry = {
  id: string;
  username: string | null;
  message: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
};

export type OrderRecord = {
  id: string;
  username: string;
  menuDate: string;
  createdAt: string;
  updatedAt: string;
  items: import("@/server/db/schema").OrderItem[];
  orderTotal: number;
};

export type LightboxPhoto = {
  url: string;
  name: string;
};
