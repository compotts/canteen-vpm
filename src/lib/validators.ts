import { z } from "zod";
import { ADMIN_PERMISSIONS } from "./permissions";

const priceInput = z
  .union([z.number(), z.string()])
  .nullish()
  .transform((value) => {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  });

const optionalText = z
  .string()
  .trim()
  .nullish()
  .transform((value) => (value ? value : null));

export const dishCreateSchema = z.object({
  id: z.string().trim().min(1, "id, category and name are required"),
  category: z.string().trim().min(1, "id, category and name are required"),
  name: z.string().trim().min(1, "id, category and name are required"),
  nameRu: optionalText,
  nameEn: optionalText,
  weight: optionalText,
  priceStudent: priceInput,
  priceTeacher: priceInput,
});

export const dishUpdateSchema = z.object({
  id: z.string().trim().min(1, "id is required"),
  category: optionalText,
  name: optionalText,
  nameRu: optionalText,
  nameEn: optionalText,
  weight: optionalText,
  priceStudent: priceInput,
  priceTeacher: priceInput,
});

export const translationCreateSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  nameRu: optionalText,
  nameEn: optionalText,
});

export const translationUpdateSchema = z.object({
  id: z.coerce.number().int("id is required"),
  name: optionalText,
  nameRu: optionalText,
  nameEn: optionalText,
});

export const feedbackCreateSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "message is required")
    .max(4000, "message is too long"),
});

const updateTextSchema = z.object({
  lt: z.string().default(""),
  ru: z.string().default(""),
  en: z.string().default(""),
});

export const appUpdateCreateSchema = z.object({
  version: optionalText,
  dateLabel: optionalText,
  emoji: optionalText,
  text: updateTextSchema.default({ lt: "", ru: "", en: "" }),
});

export const appUpdatePatchSchema = z.object({
  id: z.string().trim().min(1, "id is required"),
  version: optionalText,
  dateLabel: optionalText,
  emoji: optionalText,
  text: updateTextSchema.nullish(),
});

const orderItemSchema = z.object({
  id: z.union([z.number(), z.string()]),
  name: z.string().default(""),
  weight: z.string().default(""),
  quantity: z.coerce.number().default(0),
  pricePerUnit: z.coerce.number().default(0),
  totalPrice: z.coerce.number().default(0),
});

export const orderSaveSchema = z.object({
  menuDate: z.string().trim().min(1, "menuDate is required"),
  items: z.array(orderItemSchema).default([]),
  orderTotal: z.coerce.number().default(0),
});

export const orderPatchSchema = z.object({
  menuDate: z.string().trim().min(1, "menuDate and itemId are required"),
  itemId: z.union([z.number(), z.string()]),
  nextQuantity: z.coerce.number().default(0),
});

export const photoTargetSchema = z.object({
  table: z.enum(["dishes", "translations"], {
    message: "table must be dishes or translations",
  }),
  id: z.string().trim().min(1, "id is required"),
});

export const adminLoginSchema = z.object({
  password: z.string().min(1, "password is required"),
});

const permissionList = z
  .array(z.enum(ADMIN_PERMISSIONS))
  .default([]);

const adminUsername = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "username is required")
  .max(64, "username is too long");

export const adminCreateSchema = z.object({
  username: adminUsername,
  permissions: permissionList,
  password: z
    .string()
    .min(8, "password must be at least 8 characters")
    .max(200)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export const adminUpdateSchema = z.object({
  username: adminUsername,
  permissions: permissionList.optional(),
  password: z
    .string()
    .min(8, "password must be at least 8 characters")
    .max(200)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  regeneratePassword: z.boolean().optional(),
});
