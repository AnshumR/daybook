import type { Day, Settings, Task } from "./types";
import { isWordLevel, sentenceUsesWord, wordsForDate, type WordLevel } from "./words";

/** Word of the day counts towards the score from the day it was introduced. */
export const WORD_START = "2026-10-27";

export type DayStats = {
  habitsDone: number;
  habitsTotal: number;
  tasksDone: number;
  tasksTotal: number;
  /** Whether word of the day applies to this date, and whether it was done. */
  wordCounts: boolean;
  wordDone: boolean;
  /** 0–100, rounded */
  score: number;
  /** True when anything was recorded for the day. */
  logged: boolean;
};

export function wordEnabled(settings: Settings): boolean {
  return settings.prefs?.wordOfDay !== false;
}

export function wordLevel(settings: Settings): WordLevel {
  return isWordLevel(settings.prefs?.wordLevel) ? settings.prefs.wordLevel : "advanced";
}

export function wordDoneOn(day: Day | undefined, date: string): boolean {
  const s = day?.word_sentence;
  return !!s && wordsForDate(date).some((w) => sentenceUsesWord(s, w.word));
}

export function dayStats(settings: Settings, day: Day | undefined, tasks: Task[], date?: string): DayStats {
  const habitIds = new Set(settings.habits.map((h) => h.id));
  const habitsDone = (day?.habits_done ?? []).filter((id) => habitIds.has(id)).length;
  const habitsTotal = settings.habits.length;
  const tasksDone = tasks.filter((t) => t.done).length;
  const tasksTotal = tasks.length;
  const d = date ?? day?.date;
  const wordCounts = wordEnabled(settings) && !!d && d >= WORD_START;
  const wordDone = wordCounts && wordDoneOn(day, d!);
  const total = habitsTotal + tasksTotal + (wordCounts ? 1 : 0);
  const done = habitsDone + tasksDone + (wordDone ? 1 : 0);
  const score = total === 0 ? 0 : Math.round((done / total) * 100);
  const logged = habitsDone > 0 || tasksTotal > 0 || wordDone || !!day?.note?.trim();
  return { habitsDone, habitsTotal, tasksDone, tasksTotal, wordCounts, wordDone, score, logged };
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
