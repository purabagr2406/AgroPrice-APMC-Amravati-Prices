import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/session";
import { loginAction } from "../actions";
import { text } from "@/lib/locale";
import { getLocale } from "@/lib/server-locale";
import { LocaleSwitcher } from "@/components/locale-switcher";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getAdminSession()) redirect("/admin");
  const params = await searchParams;
  const locale = await getLocale();

  return <main className="admin"><div className="login">
    <div className="login-topbar"><Link href="/" className="muted">{text(locale, "← सार्वजनिक वेबसाइट", "← Public website")}</Link><LocaleSwitcher locale={locale} returnTo="/admin/login" /></div>
    <h1>{text(locale, "AgroPrice व्यवस्थापक लॉगिन", "AgroPrice owner login")}</h1><p className="muted">{text(locale, "अमरावती APMC चे दर अपडेट करण्यासाठी ईमेल आणि पासवर्ड वापरा.", "Sign in to update Amravati APMC market rates.")}</p>
    {params.error && <div className="error">{params.error === "invalid" ? text(locale, "कृपया योग्य ईमेल आणि पासवर्ड भरा.", "Enter a valid email and password.") : text(locale, "ईमेल किंवा पासवर्ड चुकीचा आहे.", "Email or password is incorrect.")}</div>}
    <form action={loginAction}>
      <label className="field">{text(locale, "ईमेल", "Email")}<input type="email" name="email" autoComplete="username" required /></label>
      <label className="field">{text(locale, "पासवर्ड", "Password")}<input type="password" name="password" autoComplete="current-password" required /></label>
      <button className="button" type="submit" style={{ width: "100%" }}>{text(locale, "लॉगिन", "Log in")}</button>
    </form>
    <p className="muted">{text(locale, "या साइटवर सार्वजनिक साइन-अप नाही. प्रवेश फक्त कॉन्फिगर केलेल्या admin खात्याला आहे.", "Public sign-up is disabled. Access is limited to the configured owner account.")}</p>
  </div></main>;
}
