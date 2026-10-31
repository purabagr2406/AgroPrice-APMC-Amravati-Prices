import { DailyRate } from "@/lib/models";
import { marketDate } from "@/lib/date";

export function rateHistoryStartDate(today = marketDate()) {
  const [year, month, day] = today.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day));
  start.setUTCDate(start.getUTCDate() - 89);
  return start.toISOString().slice(0, 10);
}

export function isRateDateInWindow(date: string, today = marketDate()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsedDate = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) return false;
  return date >= rateHistoryStartDate(today) && date <= today;
}

export function rateExpiryDate(date: string) {
  const expiresAt = new Date(`${date}T00:00:00+05:30`);
  expiresAt.setUTCDate(expiresAt.getUTCDate() + 90);
  return expiresAt;
}

export async function pruneExpiredRates(today = marketDate()) {
  await DailyRate.deleteMany({ date: { $lt: rateHistoryStartDate(today) } });
}
