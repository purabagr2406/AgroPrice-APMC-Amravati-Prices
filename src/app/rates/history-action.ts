"use server";

import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { Crop, DailyRate } from "@/lib/models";
import { marketDate } from "@/lib/date";
import { pruneExpiredRates, rateHistoryStartDate } from "@/lib/rate-history";
import { text } from "@/lib/locale";
import { getLocale } from "@/lib/server-locale";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export type HistoricalRate = { cropName: string; englishName: string; minPrice: number; maxPrice: number };
export type HistoricalRatesState = {
  selectedDate?: string;
  ratesDate?: string;
  rates?: HistoricalRate[];
  error?: string;
} | undefined;

export async function loadHistoricalRatesAction(
  _previousState: HistoricalRatesState,
  formData: FormData,
): Promise<HistoricalRatesState> {
  const locale = await getLocale();
  const parsed = dateSchema.safeParse(formData.get("date"));
  const today = marketDate();
  const minDate = rateHistoryStartDate(today);
  const dateValue = parsed.success ? new Date(`${parsed.data}T00:00:00Z`) : null;
  const validCalendarDate = dateValue !== null
    && Number.isFinite(dateValue.getTime())
    && dateValue.toISOString().slice(0, 10) === parsed.data;
  if (!parsed.success || !validCalendarDate || parsed.data < minDate || parsed.data > today) {
    return { error: text(locale, "गेल्या 90 दिवसांतील तारीख निवडा.", "Select a date within the last 90 days.") };
  }

  try {
    await connectToDatabase();
    await pruneExpiredRates(today);
    const crops = await Crop.find({ isActive: true }).select("_id nameMr nameEn").lean();
    const cropIds = crops.map((crop) => crop._id);
    const availableRates = await DailyRate.find({
      crop: { $in: cropIds },
      date: { $gte: minDate, $lte: parsed.data },
    }).sort({ date: -1 }).lean();
    const ratesDate = availableRates[0]?.date;
    if (!ratesDate) return { selectedDate: parsed.data, rates: [] };

    const cropById = new Map(crops.map((crop) => [String(crop._id), crop]));
    const rates = availableRates
      .filter((rate) => rate.date === ratesDate)
      .map((rate) => {
        const crop = cropById.get(String(rate.crop));
        return {
          cropName: crop?.nameMr ?? "पीक",
          englishName: crop?.nameEn ?? "",
          minPrice: rate.minPrice,
          maxPrice: rate.maxPrice,
        };
      });
    return { selectedDate: parsed.data, ratesDate, rates };
  } catch (error) {
    console.error("Could not load historical market rates:", error);
    return { error: "Historical prices could not be loaded. Please try again." };
  }
}
