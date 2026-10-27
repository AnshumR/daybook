// All dates are local calendar dates as "YYYY-MM-DD" strings.

const pad = (n: number) => String(n).padStart(2, "0");

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO(): string {
  return toISO(new Date());
}

export function parseISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  // Midday avoids daylight-saving edge cases when adding days.
  return new Date(y, m - 1, d, 12);
}

export function isISODate(s: string | null | undefined): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(parseISO(s).getTime());
}

export function addDays(s: string, n: number): string {
  const d = parseISO(s);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

/** Whole days from a to b (b − a). */
export function diffDays(a: string, b: string): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86_400_000);
}

/** Monday of the week containing s. */
export function startOfWeek(s: string): string {
  const d = parseISO(s);
  const dow = (d.getDay() + 6) % 7; // Mon = 0
  return addDays(s, -dow);
}

export function monthKey(s: string): string {
  return s.slice(0, 7);
}

export function yearOf(s: string): number {
  return Number(s.slice(0, 4));
}

export function daysInMonth(year: number, month1: number): number {
  return new Date(year, month1, 0).getDate();
}

export function monthDates(year: number, month1: number): string[] {
  const n = daysInMonth(year, month1);
  return Array.from({ length: n }, (_, i) => `${year}-${pad(month1)}-${pad(i + 1)}`);
}

/** Mon = 0 … Sun = 6 */
export function weekdayIndex(s: string): number {
  return (parseISO(s).getDay() + 6) % 7;
}

export function addMonths(s: string, n: number): string {
  const d = parseISO(s);
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1, 12);
  const day = Math.min(d.getDate(), daysInMonth(target.getFullYear(), target.getMonth() + 1));
  target.setDate(day);
  return toISO(target);
}

export function addYears(s: string, n: number): string {
  return addMonths(s, n * 12);
}

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", opts);

export const formatLong = (s: string) => fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(parseISO(s));
export const formatShort = (s: string) => fmt({ day: "numeric", month: "short" }).format(parseISO(s));
export const formatWeekdayShort = (s: string) => fmt({ weekday: "short" }).format(parseISO(s));
export const formatMonthYear = (s: string) => fmt({ month: "long", year: "numeric" }).format(parseISO(s));
export const formatMonthShort = (month1: number) => fmt({ month: "short" }).format(new Date(2000, month1 - 1, 1, 12));
export const WEEKDAY_INITIALS = ["M", "T", "W", "T", "F", "S", "S"];
