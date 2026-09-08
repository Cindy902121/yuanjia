const DAY = 86400000;

export function taipeiDay(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function calendarDay(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}

export function shiftDay(value: string, days: number) {
  const date = calendarDay(value);
  if (!date) return "";
  return new Date(date.getTime() + days * DAY).toISOString().slice(0, 10);
}

export function earliestDay(to: string) {
  const date = calendarDay(to);
  if (!date) return "";
  const year = date.getUTCFullYear() - 2, month = date.getUTCMonth();
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(date.getUTCDate(), last))).toISOString().slice(0, 10);
}

export function validatePeriod(from: string, to: string, today = taipeiDay()) {
  if (!calendarDay(from) || !calendarDay(to) || from > to) return "請填寫有效起迄日期，起日不得晚於迄日。";
  if (to > today) return "日期不可晚於今天（台北時間）。";
  if (from < earliestDay(to)) return "日期範圍不可超過 24 個月。";
  return null;
}

export function resolvePeriod(params: URLSearchParams, now = new Date()) {
  const today = taipeiDay(now), yesterday = shiftDay(today, -1);
  const absent = !params.has("date_from") && !params.has("date_to");
  const from = absent ? shiftDay(yesterday, -6) : params.get("date_from") ?? "";
  const to = absent ? yesterday : params.get("date_to") ?? "";
  const error = params.getAll("date_from").length > 1 || params.getAll("date_to").length > 1
    ? "日期參數不可重複。" : validatePeriod(from, to, today);
  return { from, to, today, absent, error };
}

export function bucketRange(bucket: string, grain: "day" | "week" | "month", from: string, to: string) {
  const start = bucket.slice(0, 10);
  const date = calendarDay(start);
  if (!date) return { from: start, to: start, partial: false };
  const end = grain === "month" ? new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).toISOString().slice(0, 10) : shiftDay(start, grain === "week" ? 6 : 0);
  return { from: start < from ? from : start, to: end > to ? to : end, partial: start < from || end > to };
}
