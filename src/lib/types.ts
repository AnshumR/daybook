export type Item = { id: string; name: string };

export type Prefs = {
  theme?: string;
  mode?: string;
  /** Category id the Day page is focused on, or null for everything. */
  focus?: string | null;
  /** Show the English word of the day (default on). */
  wordOfDay?: boolean;
  /** "advanced" (default) or "everyday". */
  wordLevel?: string;
};

/** A task that is added to the plan automatically every day. */
export type RecurringItem = {
  id: string;
  text: string;
  category_id: string | null;
  priority: Priority;
};

export type Settings = {
  habits: Item[];
  categories: Item[];
  areas: Item[];
  prefs: Prefs;
  recurring: RecurringItem[];
  /** Things to avoid (movies, ordering food…). */
  donts: Item[];
};

export type DontResult = "kept" | "slipped";

export type Priority = "high" | "medium" | "low";
export type Timeframe = "month" | "year" | "long";

export type Day = {
  date: string; // YYYY-MM-DD
  habits_done: string[];
  note: string;
  word_sentence?: string;
  went_well?: string;
  improve?: string;
  /** Seconds Daybook was open on this date. */
  app_seconds?: number;
  /** Phone screen time typed in by the user, in minutes. */
  screen_minutes?: number | null;
  /** Habit id → ISO time it was ticked. */
  habit_times?: Record<string, string>;
  /** Don't-list id → avoided or slipped. */
  donts?: Record<string, DontResult>;
  /** Today's every-day tasks have been added. */
  recurring_added?: boolean;
};

export type DayTextField = "note" | "word_sentence" | "went_well" | "improve";

export type Task = {
  id: string;
  date: string;
  text: string;
  category_id: string | null;
  priority: Priority;
  done: boolean;
  moved_count: number;
  created_at: string;
  /** Manual order within the day (lower first). */
  position?: number | null;
  /** Set when the task came from an every-day template. */
  recurring_id?: string | null;
  done_at?: string | null;
  /** First time the timer was started. */
  started_at?: string | null;
  /** Set while the timer is running. */
  running_since?: string | null;
  /** Time on the timer so far, excluding the current run. */
  elapsed_seconds?: number;
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
