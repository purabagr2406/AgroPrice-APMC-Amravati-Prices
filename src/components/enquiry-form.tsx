"use client";

import { useActionState } from "react";
import type { EnquiryFormState } from "@/app/enquiries/actions";
import { text, type Locale } from "@/lib/locale";

export function EnquiryForm({
  crops,
  action,
  locale,
}: {
  crops: Array<{ id: string; nameMr: string; nameEn: string }>;
  action: (state: EnquiryFormState, data: FormData) => Promise<EnquiryFormState>;
  locale: Locale;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return <form action={formAction} className="panel enquiry-form">
    <label className="field">{text(locale, "तुमचे नाव", "Your name")}
      <input name="farmerName" autoComplete="name" minLength={2} maxLength={80} required />
    </label>
    <label className="field">{text(locale, "मोबाईल क्रमांक", "Mobile number")}
      <input name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" pattern="[6-9][0-9]{9}" maxLength={10} placeholder={text(locale, "10 अंकी क्रमांक", "10-digit number")} required />
    </label>
    <label className="field">{text(locale, "पीक (पर्यायी)", "Crop (optional)")}
      <select name="cropId" defaultValue="">
        <option value="">{text(locale, "पीक निवडा किंवा रिकामे ठेवा", "Choose a crop or leave blank")}</option>
        {crops.map((crop) => <option key={crop.id} value={crop.id}>{locale === "en" ? crop.nameEn : crop.nameMr} / {locale === "en" ? crop.nameMr : crop.nameEn}</option>)}
      </select>
    </label>
    <label className="field">{text(locale, "तुमची चौकशी", "Your enquiry")}
      <textarea name="message" minLength={10} maxLength={1000} rows={5} required />
    </label>
    {state?.error && <div className="error" role="alert">{state.error}</div>}
    {state?.success && <div className="success" role="status">{state.success}</div>}
    <button className="button" type="submit" disabled={pending}>{pending ? text(locale, "पाठवत आहे...", "Sending...") : text(locale, "चौकशी पाठवा", "Send enquiry")}</button>
  </form>;
}
