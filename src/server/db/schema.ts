import {
  index,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { desc, sql } from "drizzle-orm";
import type { AdminPermission } from "@/lib/permissions";

export type OrderItem = {
  id: number | string;
  name: string;
  weight: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
};

export const dishes = pgTable("dishes", {
  id: text("id").primaryKey(),
  category: text("category").notNull(),
  nameLt: text("name_lt").notNull(),
  nameRu: text("name_ru"),
  nameEn: text("name_en"),
  weight: text("weight"),
  priceStudent: numeric("price_student", { precision: 10, scale: 2 }),
  priceTeacher: numeric("price_teacher", { precision: 10, scale: 2 }),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const translations = pgTable("translations", {
  id: serial("id").primaryKey(),
  nameLt: text("name_lt").notNull(),
  nameRu: text("name_ru"),
  nameEn: text("name_en"),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const orderHistory = pgTable(
  "order_history",
  {
    id: text("id").primaryKey(),
    username: text("username").notNull(),
    menuDate: text("menu_date").notNull(),
    items: jsonb("items").$type<OrderItem[]>().notNull(),
    orderTotal: numeric("order_total", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("order_history_username_menu_date_key").on(
      table.username,
      table.menuDate
    ),
    index("order_history_username_created_at_idx").on(
      table.username,
      desc(table.createdAt)
    ),
  ]
);

export const feedback = pgTable(
  "feedback",
  {
    id: uuid("id").primaryKey(),
    username: text("username"),
    message: text("message").notNull(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("feedback_created_at_idx").on(desc(table.createdAt))]
);

export const appUpdates = pgTable(
  "app_updates",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    username: text("username").notNull(),
    version: text("version"),
    dateLabel: text("date_label"),
    emoji: text("emoji"),
    textLt: text("text_lt"),
    textRu: text("text_ru"),
    textEn: text("text_en"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("app_updates_created_at_idx").on(desc(table.createdAt))]
);

export const admins = pgTable("admins", {
  username: text("username").primaryKey(),
  passwordHash: text("password_hash").notNull(),
  permissions: jsonb("permissions").$type<AdminPermission[]>().notNull(),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
