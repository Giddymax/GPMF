import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage public URLs (client identification photos, etc.)
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
  async headers() {
    return [
      {
        // Without this, some browsers can hold onto a cached copy of the
        // service worker script itself and never notice a new deploy shipped
        // a new one — the phone keeps running old cached JS whose server
        // action ids no longer match the current deployment, so buttons/forms
        // that call a server action (including sign-in) silently fail.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
