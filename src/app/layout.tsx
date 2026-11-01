import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { getLocale } from "@/lib/server-locale";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgroPrice | अमरावती APMC बाजारभाव",
  description: "AgroPrice वर अमरावती APMC मधील शेतीमालाचे बाजारभाव पहा. Crop market rates for Amravati APMC, Maharashtra.",
  applicationName: "AgroPrice",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "AgroPrice",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/agroprice-icon.svg", type: "image/svg+xml", sizes: "any" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/icon-192.png", type: "image/png", sizes: "192x192" }],
  },
  keywords: ["AgroPrice", "Amravati APMC rates", "आजचे भाव", "Soybean rate", "मंडी भाव"],
  openGraph: {
    title: "AgroPrice | अमरावती APMC बाजारभाव",
    description: "AgroPrice वर अमरावती APMC मधील शेतीमालाचे बाजारभाव पहा.",
    locale: "mr_IN",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#174d2b",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return <html lang={locale === "en" ? "en" : "mr"}><body><ServiceWorkerRegistration />{children}</body></html>;
}
