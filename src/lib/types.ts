export type Item = { id: string; name: string };

export type Prefs = {
  theme?: string;
  mode?: string;
  /** Category id the Day page is focused on, or null for everything. */
  focus?: string | null;
  /** Show the English word of the day (default on). */
  wordOfDay?: boolean;
};

export type Settings = {
  habits: Item[];
  categories: Item[];
  areas: Item[];
  prefs: Prefs;
};

export type Priority = "high" | "medium" | "low";
export type Timeframe = "month" | "year" | "long";

export type Day = {
  date: string; // YYYY-MM-DD
  habits_done: string[];
  note: string;
  word_sentence?: string;
};

export type Task = {
  id: string;
  date: string;
  text: string;
  category_id: string | null;
  priority: Priority;
  done: boolean;
  moved_count: number;
  created_at: string;
};

export type Goal = {
  id: string;
  title: string;
  area_id: string | null;
  timeframe: Timeframe;
  target_date: string | null;
  progress: number;
  next_step: string;
  done: boolean;
  created_at: string;
};

export type MonthNote = { month: string; focus: string; review: string };
export type YearNote = { year: number; theme: string };

export const PRIORITIES: Priority[] = ["high", "medium", "low"];
export const PRIORITY_LABEL: Record<Priority, string> = { high: "P1", medium: "P2", low: "P3" };
export const PRIORITY_NAME: Record<Priority, string> = { high: "P1 · Urgent", medium: "P2 · Normal", low: "P3 · Later" };
export const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export const TIMEFRAMES: Timeframe[] = ["month", "year", "long"];
export const TIMEFRAME_LABEL: Record<Timeframe, string> = { month: "Month", year: "Year", long: "Long term" };
