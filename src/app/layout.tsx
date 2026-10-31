import type { Metadata } from "next";
import { getLocale } from "@/lib/server-locale";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgroPrice | अमरावती APMC बाजारभाव",
  description: "AgroPrice वर अमरावती APMC मधील शेतीमालाचे बाजारभाव पहा. Crop market rates for Amravati APMC, Maharashtra.",
  applicationName: "AgroPrice",
  keywords: ["AgroPrice", "Amravati APMC rates", "आजचे भाव", "Soybean rate", "मंडी भाव"],
  openGraph: {
    title: "AgroPrice | अमरावती APMC बाजारभाव",
    description: "AgroPrice वर अमरावती APMC मधील शेतीमालाचे बाजारभाव पहा.",
    locale: "mr_IN",
    type: "website",
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return <html lang={locale === "en" ? "en" : "mr"}><body>{children}</body></html>;
}
