import { getStoredUsername } from "./userStorage.js";

const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.82;

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Failed to process image"))),
        "image/jpeg",
        JPEG_QUALITY
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Invalid image"));
    };
    img.src = url;
  });
}

export async function uploadPhoto(table, id, file) {
  const blob = await compressImage(file);
  const res = await fetch(`/api/photos?table=${table}&id=${encodeURIComponent(id)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "x-username": getStoredUsername() || ""
    },
    body: blob
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function deletePhoto(table, id) {
  return fetch(`/api/photos?table=${table}&id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: {
      "x-username": getStoredUsername() || ""
    }
  }).then(res => {
    if (!res.ok) {
      return res.json().then(data => {
        throw new Error(data.error || `HTTP ${res.status}`);
      });
    }
  });
}
