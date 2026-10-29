import { useMemo } from "react";
import { addDays } from "./dates";
import type { Day, Task } from "./types";

export function useTasksByDate(tasks: Task[]): Map<string, Task[]> {
  return useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.date) continue; // backlog
      const list = map.get(t.date);
      if (list) list.push(t);
      else map.set(t.date, [t]);
    }
    return map;
  }, [tasks]);
}

export function habitDone(days: Record<string, Day>, date: string, habitId: string): boolean {
  return days[date]?.habits_done?.includes(habitId) ?? false;
}

/**
 * Current streak ending on `date`. If the habit isn't ticked yet on `date`,
 * the streak still counts up to the day before (the day isn't over).
 */
export function currentStreak(days: Record<string, Day>, habitId: string, date: string): number {
  let d = habitDone(days, date, habitId) ? date : addDays(date, -1);
  let n = 0;
  while (habitDone(days, d, habitId)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}
