import { business } from "@/config/business";
import { text, type Locale } from "@/lib/locale";

export function ShopDetailsStrip({ locale }: { locale: Locale }) {
  const english = locale === "en";
  return <section className="shop-strip" aria-label={text(locale, "दुकानाची संपर्क माहिती", "Shop contact information")}>
    <div className="shop-strip-inner">
      <div className="shop-identity">
        <h2>{english ? business.shopNameEn : business.shopNameMr}</h2>
        <p className="shop-tagline">{english ? business.shopTaglineEn : business.shopTaglineMr}</p>
        <address>{english ? business.addressEn : business.addressMr}</address>
      </div>
      <div className="shop-contact">
        <span className="shop-contact-heading">{text(locale, "पीक विक्री किंवा चौकशीसाठी संपर्क करा", "Selling your crop or have a question?")}</span>
        <strong>{business.contactName}</strong>
        <a className="shop-phone" href={`tel:+91${business.phone}`}>+91 {business.phone}</a>
        <div className="shop-actions">
          <a className="button secondary" href={`tel:+91${business.phone}`}>📞 {text(locale, "कॉल करा", "Call")}</a>
          <a className="button whatsapp-button" href={`https://wa.me/${business.whatsapp}`} target="_blank" rel="noreferrer">WhatsApp</a>
          <a className="button enquiry-button" href="/enquiries">{text(locale, "चौकशी फॉर्म", "Enquiry form")}</a>
        </div>
      </div>
    </div>
  </section>;
}
