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
    prefer_related_applications: false,
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
    screenshots: [
      {
        src: "/agroprice-home-mobile.png",
        sizes: "488x1055",
        type: "image/png",
        form_factor: "narrow",
        label: "AgroPrice market rates on mobile",
      },
      {
        src: "/agroprice-home-desktop.png",
        sizes: "1600x1125",
        type: "image/png",
        form_factor: "wide",
        label: "AgroPrice market rates on desktop",
      },
    ],
  };
}
