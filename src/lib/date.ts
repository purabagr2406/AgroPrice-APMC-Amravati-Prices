export function marketDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function formatDate(date: string, locale: "mr" | "en" = "mr") {
  return new Intl.DateTimeFormat(locale === "en" ? "en-IN" : "mr-IN", {
    dateStyle: "long",
    timeZone: "Asia/Kolkata",
  }).format(new Date(`${date}T00:00:00+05:30`));
}

export function formatDateTime(date: Date | string, locale: "mr" | "en" = "mr") {
  return new Intl.DateTimeFormat(locale === "en" ? "en-IN" : "mr-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(date));
}
