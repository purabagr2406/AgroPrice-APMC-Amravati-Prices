"use client";

import { useActionState } from "react";
import { formatDate } from "@/lib/date";
import { text, type Locale } from "@/lib/locale";
import { loadHistoricalRatesAction, type HistoricalRatesState } from "@/app/rates/history-action";

export function HistoricalRates({ locale, minDate, maxDate }: { locale: Locale; minDate: string; maxDate: string }) {
  const [state, formAction, pending] = useActionState<HistoricalRatesState, FormData>(loadHistoricalRatesAction, undefined);
  const selectedDate = state?.selectedDate ?? maxDate;

  return <section className="historical-section container" aria-labelledby="historical-heading">
    <div className="historical-heading">
      <span className="history-icon" aria-hidden="true">▦</span>
      <div>
        <h2 id="historical-heading">{text(locale, "मागील बाजारभाव", "Past market rates")}</h2>
        <p>{text(locale, "गेल्या 90 दिवसांतील दर तारीख निवडून पाहा.", "Choose a date to view rates from the past 90 days.")}</p>
      </div>
    </div>
    <form action={formAction} className="historical-form">
      <label htmlFor="history-date">{text(locale, "तारीख निवडा", "Choose a date")}</label>
      <input id="history-date" name="date" type="date" min={minDate} max={maxDate} defaultValue={selectedDate} required />
      <button className="button" type="submit" disabled={pending}>
        {pending ? text(locale, "शोधत आहे...", "Searching...") : text(locale, "त्या दिवसाचे दर पाहा", "View rates")}
      </button>
    </form>
    {state?.error && <p className="error" role="alert">{state.error}</p>}
    {state?.rates && state.selectedDate && <div className="historical-results" aria-live="polite">
      {state.ratesDate
        ? <p className={state.ratesDate === state.selectedDate ? "history-result-note" : "history-result-note history-fallback"}>
          {state.ratesDate === state.selectedDate
            ? text(locale, `${formatDate(state.selectedDate, locale)} चे दर`, `Rates for ${formatDate(state.selectedDate, locale)}`)
            : text(
              locale,
              `${formatDate(state.selectedDate, locale)} रोजी दर अपलोड झाले नाहीत. ${formatDate(state.ratesDate, locale)} रोजीचे शेवटचे उपलब्ध दर दाखवत आहोत.`,
              `Rates were not uploaded on ${formatDate(state.selectedDate, locale)}. Showing the latest available rates from ${formatDate(state.ratesDate, locale)}.`,
            )}
        </p>
        : <p className="history-result-note">{text(locale, "या तारखेपर्यंत 90 दिवसांच्या कालावधीत दर अपलोड झालेले नाहीत.", "No rates were uploaded on this date or earlier within the 90-day history.")}</p>}
      {state.rates.length > 0 && <div className="panel table-wrap">
        <table><thead><tr>
          <th>{text(locale, "पीक", "Crop")}</th>
          <th>{text(locale, "दर (प्रति क्विंटल)", "Price (per quintal)")}</th>
        </tr></thead><tbody>{state.rates.map((rate) => <tr key={`${state.ratesDate}-${rate.englishName}`}>
          <td className="crop">{locale === "en" ? rate.englishName : rate.cropName}<small>{locale === "en" ? rate.cropName : rate.englishName}</small></td>
          <td className="price">₹{rate.minPrice.toLocaleString("en-IN")} – ₹{rate.maxPrice.toLocaleString("en-IN")}</td>
        </tr>)}</tbody></table>
      </div>}
    </div>}
  </section>;
}
