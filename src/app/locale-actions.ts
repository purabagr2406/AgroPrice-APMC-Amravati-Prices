"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Locale } from "@/lib/locale";

export async function changeLocaleAction(formData: FormData) {
  const value = formData.get("locale");
  const returnTo = formData.get("returnTo");
  if (value !== "mr" && value !== "en") throw new Error("Unsupported site language.");
  const allowedPaths = new Set(["/", "/rates", "/enquiries", "/admin", "/admin/enquiries", "/admin/login"]);
  if (typeof returnTo !== "string" || !allowedPaths.has(returnTo)) {
    throw new Error("Invalid language-switch return path.");
  }

  const locale: Locale = value;
  (await cookies()).set("agroprice_locale", locale, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  redirect(returnTo);
}
