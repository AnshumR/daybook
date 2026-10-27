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
