import { apiFetch } from "./client";
import type { Translation } from "@/types/api";

export type TranslationInput = {
  id?: number;
  name: string;
  nameRu: string | null;
  nameEn: string | null;
};

export function loadTranslations(): Promise<Translation[]> {
  return apiFetch<Translation[]>("/api/translations");
}

export function createTranslation(
  translation: TranslationInput
): Promise<Translation> {
  return apiFetch<Translation>("/api/translations", {
    method: "POST",
    body: translation,
  });
}

export function updateTranslation(
  translation: TranslationInput
): Promise<Translation> {
  return apiFetch<Translation>("/api/translations", {
    method: "PATCH",
    body: translation,
  });
}

export function deleteTranslation(id: number): Promise<null> {
  return apiFetch<null>(`/api/translations?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
