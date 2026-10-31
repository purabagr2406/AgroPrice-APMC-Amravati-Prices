import { cookies } from "next/headers";
import type { Locale } from "@/lib/locale";

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get("agroprice_locale")?.value;
  return value === "en" ? "en" : "mr";
}
