import Link from "next/link";
import { connectToDatabase } from "@/lib/mongodb";
import { Crop, DailyRate } from "@/lib/models";
import { formatDate, marketDate } from "@/lib/date";
import { text } from "@/lib/locale";
import { getLocale } from "@/lib/server-locale";
import { pruneExpiredRates, rateHistoryStartDate } from "@/lib/rate-history";
import { ShopDetailsStrip } from "@/components/shop-details-strip";
import { PublicFooter, PublicHeader } from "@/components/public-site-chrome";
import { HistoricalRates } from "@/components/historical-rates";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const locale = await getLocale();
  const today = marketDate();
  let latestDate = "";
  let rates: Array<{ id: string; nameMr: string; nameEn: string; minPrice: number; maxPrice: number }> = [];
  let loadError = false;
  try {
    await connectToDatabase();
    await pruneExpiredRates(today);
    const crops = await Crop.find({ isActive: true }).select("_id nameMr nameEn").lean();
    const cropIds = crops.map((crop) => crop._id);
    const rows = await DailyRate.find({ crop: { $in: cropIds } }).sort({ date: -1 }).lean();
    latestDate = rows.reduce((latest, row) => row.date > latest ? row.date : latest, "");
    const byId = new Map(crops.map((crop) => [String(crop._id), crop]));
    rates = rows.filter((row) => row.date === latestDate).map((row) => {
      const crop = byId.get(String(row.crop));
      return { id: String(row._id), nameMr: crop?.nameMr ?? "पीक", nameEn: crop?.nameEn ?? "", minPrice: row.minPrice, maxPrice: row.maxPrice };
    }).slice(0, 6);
  } catch (error) {
    console.error("Could not load market rates:", error);
    loadError = true;
  }
  const isToday = latestDate === today;

  return <div className="shell">
    <PublicHeader locale={locale} returnTo="/" />
    <main>
      <section className="section"><div className="container"><div className="heading rates-heading"><div><h1>{text(locale, "आजचे बाजारभाव", "Today’s market rates")}</h1><p>{text(locale, "अमरावती APMC", "Amravati APMC")}</p></div><Link className="text-link" href="/rates">{text(locale, "सर्व भाव", "All rates")} <span aria-hidden="true">→</span></Link></div>
        <div className="panel">
          {rates.length > 0 && <div className="status">{isToday ? text(locale, "आजचे दर", "Today’s rates") : text(locale, "शेवटचे उपलब्ध दर", "Latest available rates")}</div>}
          {!isToday && rates.length > 0 && <div className="notice">{text(locale, `आजचे दर अपलोड झाले नाहीत. ${formatDate(latestDate, locale)} रोजीचे शेवटचे उपलब्ध दर दाखवत आहोत.`, `Rates have not been uploaded today. Showing the latest available rates from ${formatDate(latestDate, locale)}.`)}</div>}
          {loadError ? <div className="empty">{text(locale, "दर सध्या लोड करता आले नाहीत. कृपया नंतर पुन्हा प्रयत्न करा.", "Rates could not be loaded. Please try again later.")}</div> : rates.length === 0 ? <div className="empty">{text(locale, "दर लवकरच अपडेट केले जातील. कृपया नंतर पुन्हा भेट द्या.", "Rates will be updated soon. Please check back later.")}</div> :
            <div className="table-wrap"><table><thead><tr><th>{text(locale, "पीक", "Crop")}</th><th>{text(locale, "दर (प्रति क्विंटल)", "Price (per quintal)")}</th></tr></thead><tbody>{rates.map((rate) => <tr key={rate.id}><td className="crop">{locale === "en" ? rate.nameEn : rate.nameMr}<small>{locale === "en" ? rate.nameMr : rate.nameEn}</small></td><td className="price">₹{rate.minPrice.toLocaleString("en-IN")} – ₹{rate.maxPrice.toLocaleString("en-IN")}</td></tr>)}</tbody></table></div>}
        </div></div></section>
      <HistoricalRates locale={locale} minDate={rateHistoryStartDate(today)} maxDate={today} />
    </main>
    <ShopDetailsStrip locale={locale} />
    <PublicFooter locale={locale} />
  </div>;
}
