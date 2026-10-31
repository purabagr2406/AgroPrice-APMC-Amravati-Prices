import { connectToDatabase } from "@/lib/mongodb";
import { Crop, DailyRate } from "@/lib/models";
import { formatDate, marketDate } from "@/lib/date";
import { ShopDetailsStrip } from "@/components/shop-details-strip";
import { PublicFooter, PublicHeader } from "@/components/public-site-chrome";
import { text } from "@/lib/locale";
import { getLocale } from "@/lib/server-locale";
import { pruneExpiredRates } from "@/lib/rate-history";

export const dynamic = "force-dynamic";

type RateRow = { id: string; nameMr: string; nameEn: string; minPrice: number; maxPrice: number };

export default async function RatesPage() {
  const locale = await getLocale();
  let error = false;
  let rates: RateRow[] = [];
  let latestDate = "";
  try {
    await connectToDatabase();
    await pruneExpiredRates();
    const crops = await Crop.find({ isActive: true }).select("_id nameMr nameEn unit").lean();
    const cropIds = crops.map((crop) => crop._id);
    const rows = await DailyRate.find({ crop: { $in: cropIds } }).sort({ date: -1 }).lean();
    latestDate = rows.reduce((latest, row) => row.date > latest ? row.date : latest, "");
    const byId = new Map(crops.map((crop) => [String(crop._id), crop]));
    rates = rows.filter((row) => row.date === latestDate).map((row) => {
      const crop = byId.get(String(row.crop));
      return { id: String(row._id), nameMr: crop?.nameMr ?? "पीक", nameEn: crop?.nameEn ?? "", minPrice: row.minPrice, maxPrice: row.maxPrice };
    });
  } catch (cause) {
    console.error("Could not load full market rates:", cause);
    error = true;
  }
  const isToday = latestDate === marketDate();

  return <main className="shell">
    <PublicHeader backHref="/" locale={locale} returnTo="/rates" />
    <div className="container section">
      <div className="heading"><div><h1>{text(locale, "बाजारभाव", "Market rates")}</h1><p>{text(locale, "अमरावती APMC", "Amravati APMC")}</p></div></div>
      <div className="panel">{rates.length > 0 && <div className="status">{isToday ? text(locale, "आजचे दर", "Today’s rates") : text(locale, "शेवटचे उपलब्ध दर", "Latest available rates")}</div>}
        {!isToday && rates.length > 0 && <div className="notice">{text(locale, `आजचे दर अपलोड झाले नाहीत. ${formatDate(latestDate, locale)} रोजीचे शेवटचे उपलब्ध दर दाखवत आहोत.`, `Rates have not been uploaded today. Showing the latest available rates from ${formatDate(latestDate, locale)}.`)}</div>}
        {error ? <div className="empty">{text(locale, "दर सध्या लोड करता आले नाहीत. कृपया नंतर पुन्हा प्रयत्न करा.", "Rates could not be loaded. Please try again later.")}</div> : rates.length === 0 ? <div className="empty"><strong>{text(locale, "दर अजून उपलब्ध नाहीत.", "No rates are available yet.")}</strong><br />{text(locale, "व्यवस्थापक दर प्रकाशित केल्यानंतर ते येथे दिसतील.", "Rates will appear here after the owner publishes them.")}</div> :
          <div className="table-wrap"><table><thead><tr><th>{text(locale, "पीक", "Crop")}</th><th>{text(locale, "दर (प्रति क्विंटल)", "Price (per quintal)")}</th></tr></thead><tbody>{rates.map((row) => <tr key={row.id}><td className="crop">{locale === "en" ? row.nameEn : row.nameMr}<small>{locale === "en" ? row.nameMr : row.nameEn}</small></td><td className="price">₹{row.minPrice.toLocaleString("en-IN")} – ₹{row.maxPrice.toLocaleString("en-IN")}</td></tr>)}</tbody></table></div>}
      </div>
      <p className="muted">{text(locale, "दर गुणवत्तेनुसार बदलू शकतात.", "Rates may vary depending on quality.")}</p>
    </div>
    <ShopDetailsStrip locale={locale} />
    <PublicFooter locale={locale} />
  </main>;
}
