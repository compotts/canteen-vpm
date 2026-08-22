import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const VALGYKLA_ORIGIN = "https://valgykla.vpm.lt";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: "/valgykla/:path*",
        destination: `${VALGYKLA_ORIGIN}/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
