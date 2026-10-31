import Link from "next/link";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import { Crop, DailyRate } from "@/lib/models";
import { getAdminSession } from "@/lib/session";
import { formatDate, marketDate } from "@/lib/date";
import { deleteCropAction, logoutAction, saveCropAction, saveRatesAction, setCropVisibilityAction } from "./actions";
import { SaveRatesForm } from "@/components/save-rates-form";
import { CropManagement } from "@/components/crop-management";
import { isRateDateInWindow, pruneExpiredRates, rateHistoryStartDate } from "@/lib/rate-history";
import { text } from "@/lib/locale";
import { getLocale } from "@/lib/server-locale";
import { LocaleSwitcher } from "@/components/locale-switcher";

export const dynamic = "force-dynamic";

type CropRow = { id: string; nameMr: string; nameEn: string; isActive: boolean };
type PriceRow = { minPrice: number; maxPrice: number };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ saved?: string; date?: string | string[] }> }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const locale = await getLocale();
  const params = await searchParams;
  const today = marketDate();
  const requestedDate = typeof params.date === "string" ? params.date : today;
  const dateIsValid = isRateDateInWindow(requestedDate, today);
  const selectedDate = dateIsValid ? requestedDate : today;
  const dateError = Boolean(params.date !== undefined && !dateIsValid);

  let crops: CropRow[] = [];
  const rateValues: Record<string, PriceRow> = {};
  let loadError = false;
  try {
    await connectToDatabase();
    await pruneExpiredRates(today);
    const cropDocs = await Crop.find().sort({ nameEn: 1 }).lean();
    const selectedRates = await DailyRate.find({ date: selectedDate }).sort({ updatedAt: -1 }).lean();
    crops = cropDocs.map((crop) => ({ id: String(crop._id), nameMr: crop.nameMr, nameEn: crop.nameEn, isActive: crop.isActive }));
    for (const rate of selectedRates) {
      const cropId = String(rate.crop);
      if (!rateValues[cropId]) {
        rateValues[cropId] = { minPrice: rate.minPrice, maxPrice: rate.maxPrice };
      }
    }
  } catch (error) {
    console.error("Could not load rates for admin editor:", error);
    loadError = true;
  }
  return <main className="admin">
    <header className="admin-head"><div className="admin-head-inner"><div><h1>🌾 AgroPrice · {text(locale, "दर व्यवस्थापन", "Rate management")}</h1><span className="muted" style={{ color: "#d5e0d6" }}>{session.email}</span></div><div className="admin-head-actions"><LocaleSwitcher locale={locale} returnTo="/admin" /><form action={logoutAction}><button className="button secondary" type="submit">{text(locale, "लॉगआउट", "Log out")}</button></form></div></div></header>
    <div className="admin-main">
      <div className="admin-title"><div><h2>{text(locale, "मालक डॅशबोर्ड", "Owner dashboard")}</h2><p>{text(locale, "पीक यादी, बाजारभाव आणि शेतकरी चौकशी व्यवस्थापित करा.", "Manage crops, market rates, and farmer enquiries.")}</p></div><div className="actions"><Link className="button secondary" href="/admin/enquiries">{text(locale, "शेतकरी चौकशी", "Farmer enquiries")}</Link><Link className="button secondary" href="/">{text(locale, "← सार्वजनिक साइट", "← Public site")}</Link></div></div>
      {params.saved === "1" && <div className="success">{text(locale, `${formatDate(selectedDate, locale)} चे दर जतन व प्रकाशित झाले.`, `Rates for ${formatDate(selectedDate, locale)} have been saved and published.`)}</div>}
      {dateError && <div className="error">{text(locale, "गेल्या 90 दिवसांतील वैध तारीख निवडा.", "Select a valid date within the last 90 days.")}</div>}
      {loadError && <div className="error">{text(locale, "डेटाबेसमधून दर मिळवता आले नाहीत. MongoDB कनेक्शन तपासा आणि पृष्ठ पुन्हा लोड करा.", "Rates could not be loaded from the database. Check MongoDB and reload the page.")}</div>}
      {!loadError && <>
        <CropManagement
          crops={crops}
          saveAction={saveCropAction}
          visibilityAction={setCropVisibilityAction}
          deleteAction={deleteCropAction}
          locale={locale}
        />
        <section className="rates-manager">
          <div className="admin-title"><div><h2>{selectedDate === today
            ? text(locale, "आजचे दर प्रकाशित करा", "Publish today’s rates")
            : text(locale, `${formatDate(selectedDate, locale)} चे दर भरा`, `Enter rates for ${formatDate(selectedDate, locale)}`)}</h2><p>{text(locale, "सक्रिय पिकांचे दर प्रति क्विंटल भरा.", "Enter per-quintal prices for active crops.")}</p></div></div>
          {Object.keys(rateValues).length === 0 && <p className="rate-date-note">{text(locale, "या तारखेसाठी अजून दर जतन नाहीत. दर भरून प्रकाशित करा.", "No rates are saved for this date yet. Enter prices below and publish.")}</p>}
          <SaveRatesForm
            key={selectedDate}
            crops={crops.filter((crop) => crop.isActive)}
            rates={rateValues}
            action={saveRatesAction}
            locale={locale}
            rateDate={selectedDate}
            minDate={rateHistoryStartDate(today)}
            maxDate={today}
          />
        </section>
      </>}
      <p className="muted">{text(locale, "दर प्रति क्विंटल आहेत. प्रकाशित केल्यावर दर सार्वजनिक पानावर दिसतील.", "Rates are per quintal. Published rates appear on the public site.")}</p>
    </div>
    <footer className="footer admin-footer"><div className="footer-inner"><span>© {new Date().getFullYear()} AgroPrice · {text(locale, "मालक डॅशबोर्ड", "Owner dashboard")}</span><Link href="/">{text(locale, "← सार्वजनिक साइट", "← Public site")}</Link></div></footer>
  </main>;
}
