"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { text, type Locale } from "@/lib/locale";

type FormState = { error?: string } | undefined;
type SaveAction = (state: FormState, data: FormData) => Promise<FormState>;

export function SaveRatesForm({ crops, rates, action, locale, rateDate, minDate, maxDate }: {
  crops: Array<{ id: string; nameMr: string; nameEn: string }>;
  rates: Record<string, { minPrice: number; maxPrice: number }>;
  action: (data: FormData) => Promise<FormState>;
  locale: Locale;
  rateDate: string;
  minDate: string;
  maxDate: string;
}) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(rateDate);
  const [changingDate, startDateChange] = useTransition();
  const wrapped: SaveAction = async (_previousState, data) => action(data);
  const [state, formAction, pending] = useActionState(wrapped, undefined);
  if (!crops.length) return <div className="panel"><div className="empty">{text(locale, "सक्रिय पिके उपलब्ध नाहीत. आधी पीक जोडा.", "No active crops. Add a crop first.")}</div></div>;

  return <form action={formAction} className="panel">
    <div className="rate-date-picker">
      <label htmlFor="admin-rate-date">{text(locale, "दर कोणत्या तारखेचे आहेत?", "Which date are these rates for?")}
        <input
          id="admin-rate-date"
          type="date"
          name="rateDate"
          min={minDate}
          max={maxDate}
          value={selectedDate}
          required
          onChange={(event) => {
            const nextDate = event.currentTarget.value;
            setSelectedDate(nextDate);
            startDateChange(() => router.push(`/admin?date=${encodeURIComponent(nextDate)}`, { scroll: false }));
          }}
        />
      </label>
      <span className="rate-date-guidance">
        {changingDate
          ? text(locale, "निवडलेल्या तारखेचे दर लोड करत आहे...", "Loading rates for the selected date...")
          : text(locale, "तारीख बदलल्यावर त्या दिवसाचे दर येथे लोड होतील.", "Changing the date loads that day’s saved rates here.")}
      </span>
    </div>
    <div className="table-wrap"><table className="admin-table"><thead><tr><th>{text(locale, "पीक", "Crop")}</th><th>{text(locale, "किमान दर ₹/क्विंटल", "Minimum ₹/quintal")}</th><th>{text(locale, "कमाल दर ₹/क्विंटल", "Maximum ₹/quintal")}</th></tr></thead><tbody>
      {crops.map((crop) => <tr key={crop.id}>
        <td className="crop">{locale === "en" ? crop.nameEn : crop.nameMr}<small>{locale === "en" ? crop.nameMr : crop.nameEn}</small></td>
        {(["min", "max"] as const).map((field) => {
          const value = rates[crop.id];
          const defaultValue = field === "min" ? value?.minPrice : value?.maxPrice;
          return <td key={field}><input type="number" min="0" step="0.01" inputMode="decimal" aria-label={`${crop.nameEn} ${field} price`} name={`rate_${crop.id}_${field}`} defaultValue={defaultValue ?? ""} disabled={changingDate} /></td>;
        })}
      </tr>)}
    </tbody></table></div>
    {state?.error && <div className="error" style={{ margin: 15 }}>{state.error}</div>}
    <div className="save-row"><button className="button" type="submit" disabled={pending || changingDate}>{changingDate
      ? text(locale, "दर लोड होत आहेत...", "Loading rates...")
      : pending ? text(locale, "जतन करत आहे...", "Saving...") : text(locale, "जतन करा आणि प्रकाशित करा", "Save and publish rates")}</button></div>
  </form>;
}
