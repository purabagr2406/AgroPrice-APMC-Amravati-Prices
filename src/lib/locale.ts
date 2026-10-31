export type Locale = "mr" | "en";

export function text(locale: Locale, marathi: string, english: string) {
  return locale === "en" ? english : marathi;
}
