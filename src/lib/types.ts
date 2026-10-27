export type Item = { id: string; name: string };

export type Settings = {
  habits: Item[];
  categories: Item[];
  areas: Item[];
};

export type Priority = "high" | "medium" | "low";
export type Timeframe = "month" | "year" | "long";

export type Day = {
  date: string; // YYYY-MM-DD
  habits_done: string[];
  note: string;
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
export const PRIORITY_LABEL: Record<Priority, string> = { high: "High", medium: "Medium", low: "Low" };
export const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export const TIMEFRAMES: Timeframe[] = ["month", "year", "long"];
export const TIMEFRAME_LABEL: Record<Timeframe, string> = { month: "Month", year: "Year", long: "Long term" };
