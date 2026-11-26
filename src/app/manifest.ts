import type { MetadataRoute } from "next";
import { APP_DESCRIPTION, APP_NAME, APP_SHORT_NAME } from "@/lib/app-metadata";

export const dynamic = "force-dynamic";

const SIZES = [48, 72, 96, 128, 192, 256, 512] as const;

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_SHORT_NAME,
    description: APP_DESCRIPTION,
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
