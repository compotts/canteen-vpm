export const CANTEEN_TIME_ZONE = "Europe/Vilnius";

export function canteenTime(now = new Date()): { date: string; hour: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CANTEEN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { date: `${values.year}-${values.month}-${values.day}`, hour: Number(values.hour) };
}

export function addMenuDays(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function isMenuDateOpen(
  date: string,
  availableDate: string | null,
  now = new Date()
): boolean {
  const local = canteenTime(now);
  return date === availableDate && date >= local.date && (date !== local.date || local.hour < 9);
}

export function suggestedMenuDate(now = new Date()): string {
  const local = canteenTime(now);
  let date = local.hour < 9 ? local.date : addMenuDays(local.date, 1);
  while ([0, 6].includes(new Date(`${date}T12:00:00Z`).getUTCDay())) date = addMenuDays(date, 1);
  return date;
}

export function menuWeek(date: string, offset = 0): string[] {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  const monday = addMenuDays(date, -(weekday === 0 ? 6 : weekday - 1) + offset * 7);
  return Array.from({ length: 7 }, (_, index) => addMenuDays(monday, index));
}
