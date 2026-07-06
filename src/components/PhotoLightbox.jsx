import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

export default function PhotoLightbox({ photo, onClose }) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!photo) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [photo, onClose]);

  if (!photo) return null;

  return (
    <div
      className="photo-lightbox fixed inset-0 z-[1200] flex items-center justify-center p-4 md:p-10"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 bg-black/75"
        style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
      />
      <button
        type="button"
        onClick={onClose}
        aria-label={t("common.close")}
        className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all"
      >
        <X className="w-6 h-6" />
      </button>
      <figure
        className="photo-lightbox-figure relative m-0 max-w-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={photo.url}
          alt={photo.name || ""}
          className="block max-w-full max-h-[78vh] mx-auto rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
        />
        {photo.name && (
          <figcaption className="mt-3 text-center text-white/90 text-sm md:text-base font-medium px-4">
            {photo.name}
          </figcaption>
        )}
      </figure>
    </div>
  );
}
