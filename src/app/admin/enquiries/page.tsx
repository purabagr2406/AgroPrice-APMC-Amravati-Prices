import Link from "next/link";
import { redirect } from "next/navigation";
import { Crop, Enquiry } from "@/lib/models";
import { connectToDatabase } from "@/lib/mongodb";
import { getAdminSession } from "@/lib/session";
import { formatDateTime } from "@/lib/date";
import { updateEnquiryStatusAction } from "./actions";
import { text } from "@/lib/locale";
import { getLocale } from "@/lib/server-locale";
import { LocaleSwitcher } from "@/components/locale-switcher";

export const dynamic = "force-dynamic";

export default async function AdminEnquiriesPage() {
  if (!(await getAdminSession())) redirect("/admin/login");
  const locale = await getLocale();
  const statusLabels: Record<string, string> = {
    new: text(locale, "नवीन", "New"),
    contacted: text(locale, "संपर्क केला", "Contacted"),
    closed: text(locale, "बंद", "Closed"),
  };

  let enquiries: Array<{
    id: string;
    farmerName: string;
    phone: string;
    cropName: string;
    message: string;
    status: string;
    createdAt: Date;
  }> = [];
  let loadError = false;
  try {
    await connectToDatabase();
    const [records, crops] = await Promise.all([
      Enquiry.find().sort({ createdAt: -1 }).limit(100).lean(),
      Crop.find().select("_id nameMr nameEn").lean(),
    ]);
    const cropsById = new Map(crops.map((crop) => [
      String(crop._id),
      locale === "en" ? `${crop.nameEn} / ${crop.nameMr}` : `${crop.nameMr} / ${crop.nameEn}`,
    ]));
    enquiries = records.map((record) => ({
      id: String(record._id),
      farmerName: record.farmerName,
      phone: record.phone,
      cropName: record.crop ? cropsById.get(String(record.crop)) ?? text(locale, "पीक उपलब्ध नाही", "Crop unavailable") : text(locale, "निवडले नाही", "Not selected"),
      message: record.message,
      status: record.status,
      createdAt: record.createdAt,
    }));
  } catch (error) {
    console.error("Could not load farmer enquiries:", error);
    loadError = true;
  }

  return <main className="admin">
    <header className="admin-head"><div className="admin-head-inner"><h1>🌾 AgroPrice · {text(locale, "शेतकरी चौकशी", "Farmer enquiries")}</h1><div className="admin-head-actions"><LocaleSwitcher locale={locale} returnTo="/admin/enquiries" /><Link className="button secondary" href="/admin">{text(locale, "← दर व्यवस्थापन", "← Rate management")}</Link></div></div></header>
    <section className="admin-main">
      <div className="admin-title"><div><h2>{text(locale, "चौकशी इनबॉक्स", "Enquiry inbox")}</h2><p>{text(locale, "नवीनतम 100 चौकशा दाखवल्या आहेत.", "Showing the 100 most recent enquiries.")}</p></div></div>
      {loadError ? <div className="error">{text(locale, "चौकशी लोड करता आल्या नाहीत. MongoDB कनेक्शन तपासा आणि पुन्हा प्रयत्न करा.", "Enquiries could not be loaded. Check MongoDB and try again.")}</div>
        : enquiries.length === 0 ? <div className="panel"><div className="empty">{text(locale, "अजून कोणतीही चौकशी आलेली नाही.", "No enquiries have arrived yet.")}</div></div>
          : <div className="enquiry-list">{enquiries.map((enquiry) =>
            <article className="panel enquiry-card" key={enquiry.id}>
              <div className="enquiry-card-head"><div><h3>{enquiry.farmerName}</h3><span className="muted">{formatDateTime(enquiry.createdAt, locale)}</span></div><span className={`enquiry-status status-${enquiry.status}`}>{statusLabels[enquiry.status] ?? enquiry.status}</span></div>
              <p><strong>{text(locale, "मोबाईल:", "Mobile:")}</strong> <a href={`tel:+91${enquiry.phone}`}>{enquiry.phone}</a></p>
              <p><strong>{text(locale, "पीक:", "Crop:")}</strong> {enquiry.cropName}</p>
              <p className="enquiry-message">{enquiry.message}</p>
              {enquiry.status !== "closed" && <div className="enquiry-actions">
                {enquiry.status === "new" && <form action={updateEnquiryStatusAction}><input type="hidden" name="enquiryId" value={enquiry.id} /><input type="hidden" name="status" value="contacted" /><button className="button secondary" type="submit">{text(locale, "संपर्क केला", "Mark contacted")}</button></form>}
                <form action={updateEnquiryStatusAction}><input type="hidden" name="enquiryId" value={enquiry.id} /><input type="hidden" name="status" value="closed" /><button className="button secondary" type="submit">{text(locale, "चौकशी बंद करा", "Close enquiry")}</button></form>
              </div>}
            </article>
          )}</div>}
    </section>
  </main>;
}
