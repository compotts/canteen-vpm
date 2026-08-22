import { ApiError } from "./client";

const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.82;

function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(
        1,
        MAX_DIMENSION / Math.max(image.width, image.height)
      );
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);

      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Failed to process image"));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("Failed to process image")),
        "image/jpeg",
        JPEG_QUALITY
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Invalid image"));
    };

    image.src = url;
  });
}

export type PhotoTable = "dishes" | "translations";

function photoUrl(table: PhotoTable, id: string | number): string {
  return `/api/photos?table=${table}&id=${encodeURIComponent(String(id))}`;
}

async function assertOk(response: Response): Promise<void> {
  if (response.ok) return;
  const data = await response.json().catch(() => null);
  throw new ApiError(
    response.status,
    (data as { error?: string } | null)?.error ?? `HTTP ${response.status}`
  );
}

export async function uploadPhoto(
  table: PhotoTable,
  id: string | number,
  file: File
): Promise<{ id: string; photoUrl: string }> {
  const blob = await compressImage(file);
  const response = await fetch(photoUrl(table, id), {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: blob,
  });

  await assertOk(response);
  return response.json();
}

export async function deletePhoto(
  table: PhotoTable,
  id: string | number
): Promise<void> {
  const response = await fetch(photoUrl(table, id), { method: "DELETE" });

  await assertOk(response);
}
