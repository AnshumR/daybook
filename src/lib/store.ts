"use client";

import { useSyncExternalStore } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./supabase/client";
import { DEFAULT_SETTINGS } from "./defaults";
import { uuid } from "./ids";
import type { Day, Goal, MonthNote, Priority, Settings, Task, YearNote } from "./types";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export type Data = {
  userId: string;
  email: string;
  settings: Settings;
  days: Record<string, Day>;
  tasks: Task[];
  goals: Goal[];
  monthNotes: Record<string, MonthNote>;
  yearNotes: Record<number, YearNote>;
};

export type StoreState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "ready"; data: Data; status: SaveStatus };

const PAGE = 1000;
const DEBOUNCE_MS = 700;

class DaybookStore {
  private sb: SupabaseClient = createClient();
  private state: StoreState = { phase: "loading" };
  private listeners = new Set<() => void>();
  private queue: Promise<void> = Promise.resolve();
  private pending = 0;
  private failed = false;
  private timers = new Map<string, { timer: ReturnType<typeof setTimeout>; run: () => void }>();
  private savedTimer: ReturnType<typeof setTimeout> | null = null;
  private started = false;

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getSnapshot = () => this.state;

  private emit() {
    this.listeners.forEach((l) => l());
  }

  private get data(): Data {
    if (this.state.phase !== "ready") throw new Error("Store not ready");
    return this.state.data;
  }

  private setData(update: (d: Data) => Data) {
    if (this.state.phase !== "ready") return;
    this.state = { ...this.state, data: update(this.state.data) };
    this.emit();
  }

  private setStatus(status: SaveStatus) {
    if (this.state.phase !== "ready") return;
    this.state = { ...this.state, status };
    this.emit();
  }

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------

  start() {
    if (this.started) return;
    this.started = true;
    if (typeof window !== "undefined") {
      const flush = () => {
        if (document.visibilityState === "hidden") this.flushDebounced();
      };
      document.addEventListener("visibilitychange", flush);
      window.addEventListener("pagehide", () => this.flushDebounced());
    }
    void this.load();
  }

  async reload() {
    this.flushDebounced();
    await this.queue;
    this.failed = false;
    this.state = { phase: "loading" };
    this.emit();
    await this.load();
  }

  private async fetchAll<T>(table: string, columns: string, order: string): Promise<T[]> {
    const out: T[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await this.sb
        .from(table)
        .select(columns)
        .order(order, { ascending: true })
        .range(from, from + PAGE - 1);
      if (error) throw error;
      out.push(...((data ?? []) as T[]));
      if (!data || data.length < PAGE) break;
    }
    return out;
  }

  private async load() {
    try {
      const {
        data: { user },
      } = await this.sb.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }

      const settingsRes = await this.sb.from("settings").select("habits, categories, areas").maybeSingle();
      if (settingsRes.error) throw settingsRes.error;
      let settings: Settings;
      if (settingsRes.data) {
        settings = {
          habits: settingsRes.data.habits ?? [],
          categories: settingsRes.data.categories ?? [],
          areas: settingsRes.data.areas ?? [],
        };
      } else {
        // First visit: give the new user editable starter data.
        settings = DEFAULT_SETTINGS;
        const { error } = await this.sb
          .from("settings")
          .upsert({ user_id: user.id, ...DEFAULT_SETTINGS }, { onConflict: "user_id", ignoreDuplicates: true });
        if (error) throw error;
      }

      const [days, tasks, goals, monthNotes, yearNotes] = await Promise.all([
        this.fetchAll<Day>("days", "date, habits_done, note", "date"),
        this.fetchAll<Task>("tasks", "id, date, text, category_id, priority, done, moved_count, created_at", "created_at"),
        this.fetchAll<Goal>(
          "goals",
          "id, title, area_id, timeframe, target_date, progress, next_step, done, created_at",
          "created_at",
        ),
        this.fetchAll<MonthNote>("month_notes", "month, focus, review", "month"),
        this.fetchAll<YearNote>("year_notes", "year, theme", "year"),
      ]);

      this.state = {
        phase: "ready",
        status: "idle",
        data: {
          userId: user.id,
          email: user.email ?? "",
          settings,
          days: Object.fromEntries(days.map((d) => [d.date, { ...d, habits_done: d.habits_done ?? [] }])),
          tasks,
          goals,
          monthNotes: Object.fromEntries(monthNotes.map((m) => [m.month, m])),
          yearNotes: Object.fromEntries(yearNotes.map((y) => [y.year, y])),
        },
      };
      this.emit();
    } catch (e) {
      const message = e instanceof Error ? e.message : typeof e === "object" && e && "message" in e ? String((e as { message: unknown }).message) : "Something went wrong";
      this.state = { phase: "error", message };
      this.emit();
    }
  }

  // ---------------------------------------------------------------------------
  // Saving: every write runs in order through one queue so rapid taps never
  // land out of sequence. The UI has already been updated optimistically.
  // ---------------------------------------------------------------------------

  private save(fn: (sb: SupabaseClient) => PromiseLike<{ error: unknown }>) {
    this.pending++;
    if (this.savedTimer) clearTimeout(this.savedTimer);
    this.setStatus("saving");
    this.queue = this.queue.then(async () => {
      try {
        const { error } = await fn(this.sb);
        if (error) throw error;
      } catch (e) {
        console.error("Daybook save failed", e);
        this.failed = true;
      } finally {
        this.pending--;
        if (this.pending === 0) {
          this.setStatus(this.failed ? "error" : "saved");
          if (!this.failed) {
            this.savedTimer = setTimeout(() => {
              if (this.state.phase === "ready" && this.state.status === "saved") this.setStatus("idle");
            }, 2000);
          }
        }
      }
    });
  }

  private debounce(key: string, run: () => void) {
    const existing = this.timers.get(key);
    if (existing) clearTimeout(existing.timer);
    if (this.savedTimer) clearTimeout(this.savedTimer);
    this.setStatus("saving");
    const timer = setTimeout(() => {
      this.timers.delete(key);
      run();
    }, DEBOUNCE_MS);
    this.timers.set(key, { timer, run });
  }

  flushDebounced() {
    for (const [key, { timer, run }] of this.timers) {
      clearTimeout(timer);
      this.timers.delete(key);
      run();
    }
  }

  // ---------------------------------------------------------------------------
  // Days
  // ---------------------------------------------------------------------------

  private patchDay(date: string, patch: Partial<Day>) {
    this.setData((d) => {
      const day = d.days[date] ?? { date, habits_done: [], note: "" };
      return { ...d, days: { ...d.days, [date]: { ...day, ...patch } } };
    });
  }

  toggleHabit(date: string, habitId: string) {
    const current = this.data.days[date]?.habits_done ?? [];
    const next = current.includes(habitId) ? current.filter((id) => id !== habitId) : [...current, habitId];
    this.patchDay(date, { habits_done: next });
    const userId = this.data.userId;
    this.save((sb) =>
      sb.from("days").upsert({ user_id: userId, date, habits_done: next }, { onConflict: "user_id,date" }),
    );
  }

  setDayNote(date: string, note: string) {
    this.patchDay(date, { note });
    const userId = this.data.userId;
    this.debounce(`note:${date}`, () => {
      const latest = this.state.phase === "ready" ? (this.state.data.days[date]?.note ?? "") : note;
      this.save((sb) => sb.from("days").upsert({ user_id: userId, date, note: latest }, { onConflict: "user_id,date" }));
    });
  }

  // ---------------------------------------------------------------------------
  // Tasks
  // ---------------------------------------------------------------------------

  addTask(date: string, text: string, categoryId: string | null, priority: Priority) {
    const task: Task = {
      id: uuid(),
      date,
      text,
      category_id: categoryId,
      priority,
      done: false,
      moved_count: 0,
      created_at: new Date().toISOString(),
    };
    this.setData((d) => ({ ...d, tasks: [...d.tasks, task] }));
    const userId = this.data.userId;
    this.save((sb) => sb.from("tasks").insert({ ...task, user_id: userId }));
  }

  updateTask(id: string, patch: Partial<Pick<Task, "text" | "category_id" | "priority" | "done" | "date" | "moved_count">>) {
    this.setData((d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
    this.save((sb) => sb.from("tasks").update(patch).eq("id", id));
  }

  deleteTask(id: string) {
    this.setData((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) }));
    this.save((sb) => sb.from("tasks").delete().eq("id", id));
  }

  moveTasks(ids: string[], toDate: string) {
    const tasks = this.data.tasks.filter((t) => ids.includes(t.id));
    for (const t of tasks) this.updateTask(t.id, { date: toDate, moved_count: t.moved_count + 1 });
  }

  // ---------------------------------------------------------------------------
  // Goals
  // ---------------------------------------------------------------------------

  addGoal(partial: Partial<Goal>) {
    const goal: Goal = {
      id: uuid(),
      title: "",
      area_id: this.data.settings.areas[0]?.id ?? null,
      timeframe: "month",
      target_date: null,
      progress: 0,
      next_step: "",
      done: false,
      created_at: new Date().toISOString(),
      ...partial,
    };
    this.setData((d) => ({ ...d, goals: [...d.goals, goal] }));
    const userId = this.data.userId;
    this.save((sb) => sb.from("goals").insert({ ...goal, user_id: userId }));
    return goal.id;
  }

  updateGoal(id: string, patch: Partial<Omit<Goal, "id" | "created_at">>) {
    this.setData((d) => ({ ...d, goals: d.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
    this.save((sb) => sb.from("goals").update(patch).eq("id", id));
  }

  deleteGoal(id: string) {
    this.setData((d) => ({ ...d, goals: d.goals.filter((g) => g.id !== id) }));
    this.save((sb) => sb.from("goals").delete().eq("id", id));
  }

  // ---------------------------------------------------------------------------
  // Month and year notes
  // ---------------------------------------------------------------------------

  setMonthNote(month: string, field: "focus" | "review", value: string) {
    this.setData((d) => {
      const note = d.monthNotes[month] ?? { month, focus: "", review: "" };
      return { ...d, monthNotes: { ...d.monthNotes, [month]: { ...note, [field]: value } } };
    });
    const userId = this.data.userId;
    this.debounce(`month:${month}:${field}`, () => {
      const latest = this.state.phase === "ready" ? (this.state.data.monthNotes[month]?.[field] ?? "") : value;
      this.save((sb) =>
        sb.from("month_notes").upsert({ user_id: userId, month, [field]: latest }, { onConflict: "user_id,month" }),
      );
    });
  }

  setYearTheme(year: number, theme: string) {
    this.setData((d) => ({ ...d, yearNotes: { ...d.yearNotes, [year]: { year, theme } } }));
    const userId = this.data.userId;
    this.debounce(`year:${year}`, () => {
      const latest = this.state.phase === "ready" ? (this.state.data.yearNotes[year]?.theme ?? "") : theme;
      this.save((sb) => sb.from("year_notes").upsert({ user_id: userId, year, theme: latest }, { onConflict: "user_id,year" }));
    });
  }

  // ---------------------------------------------------------------------------
  // Settings and account
  // ---------------------------------------------------------------------------

  updateSettings(patch: Partial<Settings>) {
    this.setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
    const userId = this.data.userId;
    this.save((sb) => sb.from("settings").update(patch).eq("user_id", userId));
  }

  async signOut() {
    this.flushDebounced();
    await this.queue;
    await this.sb.auth.signOut();
    window.location.href = "/login";
  }

  async deleteAccount(): Promise<string | null> {
    this.flushDebounced();
    await this.queue;
    const { error } = await this.sb.rpc("delete_my_account");
    if (error) return error.message;
    await this.sb.auth.signOut();
    window.location.href = "/login?deleted=1";
    return null;
  }
}

let store: DaybookStore | null = null;

export function getStore(): DaybookStore {
  if (!store) store = new DaybookStore();
  return store;
}

const serverSnapshot: StoreState = { phase: "loading" };

export function useStoreState(): StoreState {
  const s = getStore();
  return useSyncExternalStore(s.subscribe, s.getSnapshot, () => serverSnapshot);
}

/** Only call inside components rendered once the store is ready. */
export function useData(): Data {
  const state = useStoreState();
  if (state.phase !== "ready") throw new Error("Daybook data not loaded");
  return state.data;
}
