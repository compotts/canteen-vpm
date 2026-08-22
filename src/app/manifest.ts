import type { MetadataRoute } from "next";

const SIZES = [48, 72, 96, 128, 192, 256, 512] as const;

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Valgyklos VPM",
    short_name: "Valgykla",
    description:
      "Vilniaus Petro Vileišio progimnazijos valgyklos meniu, užsakymai ir istorija.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f5f5f5",
    theme_color: "#f5f5f5",
    categories: ["food", "education"],
    icons: SIZES.map((size) => ({
      src: `/icons/icon-${size}.webp`,
      sizes: `${size}x${size}`,
      type: "image/webp",
      purpose: "any",
    })),
  };
}
