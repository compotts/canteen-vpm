"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Image as ImageIcon, Trash2, Upload } from "lucide-react";
import { loadDishes } from "@/lib/api/dishes";
import { loadTranslations } from "@/lib/api/translations";
import { deletePhoto, uploadPhoto, type PhotoTable } from "@/lib/api/photos";
import { ErrorBanner } from "./error-banner";
import { localizedName } from "./translations-tab";
import type { Dish, Translation } from "@/types/api";

const SOURCES: PhotoTable[] = ["dishes", "translations"];

type PhotoItem = Dish | Translation;

export function PhotosTab() {
  const t = useTranslations();
  const locale = useLocale();

  const [source, setSource] = useState<PhotoTable>("dishes");
  const [items, setItems] = useState<PhotoItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const load = source === "dishes" ? loadDishes() : loadTranslations();
    load
      .then((list: PhotoItem[]) => {
        if (!cancelled) setItems(list);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || t("admin.loadError"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [source, t]);

  const filtered = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return items;

    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.nameRu?.toLowerCase().includes(query) ||
        item.nameEn?.toLowerCase().includes(query)
    );
  }, [items, search]);

  const handleUpload = async (item: PhotoItem, file: File | undefined) => {
    if (!file) return;

    setUploadingId(item.id);
    setError(null);

    try {
      const { photoUrl } = await uploadPhoto(source, item.id, file);
      setItems((previous) =>
        previous.map((entry) =>
          entry.id === item.id ? { ...entry, photoUrl } : entry
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("admin.photos.uploadError")
      );
    } finally {
      setUploadingId(null);
    }
  };

  const handleDelete = async (item: PhotoItem) => {
    if (!window.confirm(t("admin.photos.deleteConfirm"))) return;
    setError(null);

    try {
      await deletePhoto(source, item.id);
      setItems((previous) =>
        previous.map((entry) =>
          entry.id === item.id ? { ...entry, photoUrl: null } : entry
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("admin.photos.uploadError")
      );
    }
  };

  return (
    <>
      <ErrorBanner message={error} />

      <div className="inline-flex items-center gap-1 surface rounded-full p-1 mb-4">
        {SOURCES.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setSource(value);
              setSearch("");
            }}
            className={`px-3 py-1.5 text-xs md:text-sm rounded-full font-medium ${
              source === value
                ? "bg-[var(--accent)] text-[var(--btn-primary-color)]"
                : "text-[var(--text-muted)] hover:bg-[var(--hover)]"
            }`}
          >
            {t(`admin.photos.source.${value}`)}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <input
          type="text"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)]"
          placeholder={t("admin.dishes.searchPlaceholder")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        {loading ? (
          <p className="text-[var(--text-muted)] text-sm py-4">
            {t("admin.dishes.loading")}
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm py-4">
            {t("admin.dishes.noResults")}
          </p>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="surface rounded-[var(--radius-md)] p-3 flex items-center gap-3"
            >
              {item.photoUrl ? (
                <img
                  src={item.photoUrl}
                  alt={item.name}
                  loading="lazy"
                  className="w-14 h-14 object-cover rounded-lg flex-shrink-0 border border-[var(--border)]"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg flex-shrink-0 border border-dashed border-[var(--border)] flex items-center justify-center text-[var(--text-muted)]">
                  <ImageIcon className="w-5 h-5" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="m-0 text-sm font-medium text-[var(--text)]">
                  {localizedName(item, locale)}
                </p>
                <div className="mt-1 space-y-0.5 text-xs text-[var(--text-muted)]">
                  {item.nameRu && <p className="m-0">{item.nameRu}</p>}
                  {item.nameEn && <p className="m-0">{item.nameEn}</p>}
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <label
                  className={`p-1.5 rounded-lg cursor-pointer text-[var(--text-muted)] hover:bg-[var(--hover)] hover:text-[var(--text)] ${
                    uploadingId === item.id
                      ? "opacity-50 pointer-events-none"
                      : ""
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingId !== null}
                    onChange={(event) => {
                      handleUpload(item, event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                </label>

                {item.photoUrl && (
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg"
                    aria-label={t("admin.delete")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
