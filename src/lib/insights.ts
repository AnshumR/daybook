import { addDays, toISO } from "./dates";
import type { Task } from "./types";

export type PlannedAt = { time: Date; nightBefore: boolean };

/**
 * When the day was planned: the earliest task written for it, either on the day
 * itself or from midday the day before ("planned the night before").
 * Carried-over tasks don't count.
 */
export function plannedAt(tasksForDate: Task[], date: string): PlannedAt | null {
  const prev = addDays(date, -1);
  let best: Date | null = null;
  for (const t of tasksForDate) {
    if (t.moved_count > 0) continue;
    const c = new Date(t.created_at);
    if (Number.isNaN(c.getTime())) continue;
    const cd = toISO(c);
    if (cd === date || (cd === prev && c.getHours() >= 12)) {
      if (!best || c < best) best = c;
    }
  }
  return best ? { time: best, nightBefore: toISO(best) !== date } : null;
}

export function formatClock(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", hour12: true }).format(d).replace(" ", " ");
}

export function describePlanned(p: PlannedAt | null): string {
  if (!p) return "Not planned yet";
  return p.nightBefore ? `Planned last night at ${formatClock(p.time)}` : `Planned at ${formatClock(p.time)}`;
}

/** "3h 20m", "45 min", "under a minute" */
export function formatMinutes(mins: number): string {
  const m = Math.round(mins);
  if (m < 1) return "under a minute";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}

/** Minutes after midnight, for averaging times of day. */
export function minutesOfDay(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

export function clockFromMinutes(mins: number): string {
  const d = new Date(2000, 0, 1, Math.floor(mins / 60), Math.round(mins % 60));
  return formatClock(d);
}
