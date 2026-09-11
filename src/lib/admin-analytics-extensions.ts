export const ANALYTICS_TIME_ZONE = "Asia/Taipei";
export const ANALYTICS_PAGE_SIZE = 50;
export const ANALYTICS_EXPORT_MAX_ATTEMPTS = 3;
export const ANALYTICS_RETRY_MINUTES = 5;

export type ScheduleFrequency = "daily" | "weekly" | "monthly";

export type ScheduleDefinition = {
  frequency: ScheduleFrequency;
  time_local: string;
  weekday?: number | null;
  month_day?: number | null;
};

export function validateSavedFilterName(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return "請輸入常用篩選名稱。";
  if (value.trim().length > 80) return "常用篩選名稱不可超過 80 字。";
  return null;
}

export function resolveMonthlyRunDate(year: number, month: number, requestedDay: number) {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = Math.min(Math.max(requestedDay, 1), lastDay);
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

export function taipeiParts(value: Date | string = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ANALYTICS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    weekday,
    day: Number(get("day")),
  };
}

export function isScheduleDue(schedule: ScheduleDefinition, now: Date | string = new Date()) {
  const current = taipeiParts(now);
  const [hour, minute] = schedule.time_local.split(":").map(Number);
  if (current.hour !== hour || current.minute !== minute) return false;
  if (schedule.frequency === "weekly") return current.weekday === schedule.weekday;
  if (schedule.frequency === "monthly") {
    const lastDay = new Date(Date.UTC(Number(current.date.slice(0, 4)), Number(current.date.slice(5, 7)), 0)).getUTCDate();
    return current.day === Math.min(schedule.month_day ?? 1, lastDay);
  }
  return true;
}

export function isBusinessAnomaly(current: number, previous: number) {
  if (current === 0 && previous > 0) return true;
  return previous >= 10 && current <= previous * 0.5;
}

export function hasNoEventsWithBaseline(current: number, previousSevenDays: number) {
  return current === 0 && previousSevenDays >= 10;
}

export function shouldCreateAlert(existingStatus: string | null | undefined) {
  return existingStatus === null || existingStatus === undefined || existingStatus === "recovered";
}

export function nextRetryAt(from: Date | string = new Date()) {
  const date = from instanceof Date ? new Date(from) : new Date(from);
  date.setUTCMinutes(date.getUTCMinutes() + ANALYTICS_RETRY_MINUTES);
  return date.toISOString();
}
