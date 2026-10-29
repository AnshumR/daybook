import { toISO } from "./dates";
import type { Task } from "./types";

export const REMIND_AFTER_MS = 2 * 60 * 60 * 1000;
/** Carried-over tasks start their 2-hour clock at this hour, not at midnight. */
const DAY_START_HOUR = 9;

/**
 * Tasks that need a nudge: unfinished today, either P1 or in the focus category,
 * and waiting at least 2 hours (counted from creation or 9am, whichever is later).
 */
export function overdueTasks(tasks: Task[], focus: string | null, now: Date = new Date()): Task[] {
  const today = toISO(now);
  const dayStart = new Date(now);
  dayStart.setHours(DAY_START_HOUR, 0, 0, 0);
  return tasks.filter((t) => {
    if (t.date !== today || t.done) return false;
    if (t.priority !== "high" && !(focus && t.category_id === focus)) return false;
    const since = Math.max(Date.parse(t.created_at) || 0, dayStart.getTime());
    return now.getTime() - since >= REMIND_AFTER_MS;
  });
}

/** Unfinished tasks whose reminder time has come. */
export function dueReminders(tasks: Task[], now: Date = new Date()): Task[] {
  return tasks
    .filter((t) => !t.done && t.remind_at && Date.parse(t.remind_at) <= now.getTime())
    .sort((a, b) => (a.remind_at ?? "").localeCompare(b.remind_at ?? ""));
}

/** "Today 6:00 pm", "Tomorrow 9:00 am", "Fri 31 Oct, 9:00 am" */
export function formatReminder(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  const time = new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", hour12: true }).format(d);
  const today = toISO(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const day = toISO(d);
  if (day === today) return `Today ${time}`;
  if (day === toISO(tomorrow)) return `Tomorrow ${time}`;
  return `${new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" }).format(d)}, ${time}`;
}

/** Quick reminder choices, as ISO strings. */
export function reminderPresets(now: Date = new Date()): { label: string; iso: string }[] {
  const at = (days: number, hour: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(hour, 0, 0, 0);
    return d;
  };
  const inHour = new Date(now.getTime() + 60 * 60 * 1000);
  const evening = at(0, 18);
  const nextMonday = at(((8 - now.getDay()) % 7) || 7, 9);
  const presets = [{ label: "In 1 hour", iso: inHour.toISOString() }];
  if (evening > now) presets.push({ label: "This evening", iso: evening.toISOString() });
  presets.push({ label: "Tomorrow 9 am", iso: at(1, 9).toISOString() });
  presets.push({ label: "Next Monday", iso: nextMonday.toISOString() });
  return presets;
}

/** ISO → value for <input type="datetime-local"> in local time. */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
