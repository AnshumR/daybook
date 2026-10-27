import type { Day, Settings, Task } from "./types";

export type DayStats = {
  habitsDone: number;
  habitsTotal: number;
  tasksDone: number;
  tasksTotal: number;
  /** 0–100, rounded */
  score: number;
  /** True when anything was recorded for the day. */
  logged: boolean;
};

export function dayStats(settings: Settings, day: Day | undefined, tasks: Task[]): DayStats {
  const habitIds = new Set(settings.habits.map((h) => h.id));
  const habitsDone = (day?.habits_done ?? []).filter((id) => habitIds.has(id)).length;
  const habitsTotal = settings.habits.length;
  const tasksDone = tasks.filter((t) => t.done).length;
  const tasksTotal = tasks.length;
  const total = habitsTotal + tasksTotal;
  const score = total === 0 ? 0 : Math.round(((habitsDone + tasksDone) / total) * 100);
  const logged = habitsDone > 0 || tasksTotal > 0 || !!day?.note?.trim();
  return { habitsDone, habitsTotal, tasksDone, tasksTotal, score, logged };
}

/** Heatmap level 0–4. Days with nothing logged are level 0. */
export function scoreLevel(stats: DayStats): number {
  if (!stats.logged || stats.score === 0) return 0;
  if (stats.score < 25) return 1;
  if (stats.score < 50) return 2;
  if (stats.score < 75) return 3;
  return 4;
}

export function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}
