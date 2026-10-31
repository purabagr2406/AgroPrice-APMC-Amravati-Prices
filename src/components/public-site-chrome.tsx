import Link from "next/link";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { text, type Locale } from "@/lib/locale";

function AgroPriceMark() {
  return <svg className="brand-mark" viewBox="0 0 48 48" aria-hidden="true">
    <path d="M24 39V14" />
    <path d="M23 27c-8 0-13-5-13-13 8 0 13 5 13 13Z" />
    <path d="M25 21c0-8 5-13 13-13 0 8-5 13-13 13Z" />
    <path d="M24 35c-6 0-10-4-10-10 6 0 10 4 10 10Z" />
    <path d="M24 39h13" />
  </svg>;
}

export function PublicHeader({ backHref, locale, returnTo }: { backHref?: string; locale: Locale; returnTo: string }) {
  return <header className="site-header">
    <div className="site-header-inner">
      {backHref && <Link className="header-back" href={backHref} aria-label="मागील पानावर जा">
        <span aria-hidden="true">←</span><span>परत</span>
      </Link>}
      <Link className="brand" href="/">
        <span className="brand-icon"><AgroPriceMark /></span>
        <span className="brand-copy">AgroPrice<small>{text(locale, "अमरावती APMC", "Amravati APMC")}</small></span>
      </Link>
      <nav className="site-nav" aria-label={text(locale, "मुख्य नेव्हिगेशन", "Main navigation")}>
        <Link href="/rates">{text(locale, "बाजारभाव", "Market rates")}</Link>
        <Link className="site-nav-cta" href="/enquiries">{text(locale, "शेतकरी चौकशी", "Farmer enquiry")} <span aria-hidden="true">→</span></Link>
      </nav>
      <LocaleSwitcher locale={locale} returnTo={returnTo} />
    </div>
  </header>;
}

export function PublicFooter({ locale }: { locale: Locale }) {
  return <footer className="site-footer">
    <div className="site-footer-inner">
      <Link className="footer-brand" href="/">
        <span className="footer-mark"><AgroPriceMark /></span>
        <span><strong>AgroPrice</strong><small>{text(locale, "अमरावती APMC बाजारभाव", "Amravati APMC market rates")}</small></span>
      </Link>
      <nav className="footer-links" aria-label={text(locale, "फुटर नेव्हिगेशन", "Footer navigation")}>
        <Link href="/rates">{text(locale, "बाजारभाव", "Market rates")}</Link>
        <Link href="/enquiries">{text(locale, "शेतकरी चौकशी", "Farmer enquiry")}</Link>
        <Link href="/admin/login">{text(locale, "व्यवस्थापक", "Owner login")}</Link>
      </nav>
      <span className="footer-copyright">© {new Date().getFullYear()} AgroPrice</span>
    </div>
  </footer>;
}
