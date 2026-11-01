import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "AgroPrice | Amravati APMC Market Rates",
    short_name: "AgroPrice",
    description: "Amravati APMC crop market rates and farmer enquiries.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait-primary",
    background_color: "#ffffff",
    theme_color: "#174d2b",
    categories: ["business", "finance"],
    lang: "en-IN",
    dir: "ltr",
    icons: [
      { src: "/agroprice-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
