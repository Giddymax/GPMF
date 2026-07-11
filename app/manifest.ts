import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Grainy Palace Financial Service",
    short_name: "Grainy Palace",
    description: "Daily susu, savings, fixed deposits and micro-loans — brought to your doorstep.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAFAF7",
    theme_color: "#051429",
    orientation: "portrait-primary",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
