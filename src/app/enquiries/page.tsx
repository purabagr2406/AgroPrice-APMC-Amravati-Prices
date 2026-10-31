import { EnquiryForm } from "@/components/enquiry-form";
import { submitEnquiryAction } from "./actions";
import { connectToDatabase } from "@/lib/mongodb";
import { Crop } from "@/lib/models";
import { ShopDetailsStrip } from "@/components/shop-details-strip";
import { PublicFooter, PublicHeader } from "@/components/public-site-chrome";
import { text } from "@/lib/locale";
import { getLocale } from "@/lib/server-locale";

export const dynamic = "force-dynamic";

export default async function EnquiriesPage() {
  const locale = await getLocale();
  let crops: Array<{ id: string; nameMr: string; nameEn: string }> = [];
  let loadError = false;
  try {
    await connectToDatabase();
    const records = await Crop.find({ isActive: true }).sort({ nameEn: 1 }).select("_id nameMr nameEn").lean();
    crops = records.map((crop) => ({ id: String(crop._id), nameMr: crop.nameMr, nameEn: crop.nameEn }));
  } catch (error) {
    console.error("Could not load crops for farmer enquiry:", error);
    loadError = true;
  }

  return <main className="shell">
    <PublicHeader backHref="/" locale={locale} returnTo="/enquiries" />
    <section className="container section enquiry-section">
      <div className="heading"><div><h1>{text(locale, "शेतकरी चौकशी", "Farmer enquiry")}</h1><p>{text(locale, "आमच्याशी संपर्क साधण्यासाठी फॉर्म भरा.", "Fill in the form and we’ll get in touch.")}</p></div></div>
      {loadError
        ? <div className="error">{text(locale, "फॉर्म सध्या लोड करता आला नाही. कृपया नंतर पुन्हा प्रयत्न करा.", "The form could not be loaded. Please try again later.")}</div>
        : <EnquiryForm crops={crops} action={submitEnquiryAction} locale={locale} />}
    </section>
    <ShopDetailsStrip locale={locale} />
    <PublicFooter locale={locale} />
  </main>;
}
