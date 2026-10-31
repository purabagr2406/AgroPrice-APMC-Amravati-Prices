import { changeLocaleAction } from "@/app/locale-actions";
import type { Locale } from "@/lib/locale";

export function LocaleSwitcher({ locale, returnTo }: { locale: Locale; returnTo: string }) {
  const nextLocale = locale === "mr" ? "en" : "mr";
  return <form action={changeLocaleAction} className="locale-switcher">
    <input type="hidden" name="locale" value={nextLocale} />
    <input type="hidden" name="returnTo" value={returnTo} />
    <button type="submit" aria-label={locale === "mr" ? "Switch language to English" : "भाषा मराठीत बदला"}>
      <span aria-hidden="true">文</span>{locale === "mr" ? "English" : "मराठी"}
    </button>
  </form>;
}
