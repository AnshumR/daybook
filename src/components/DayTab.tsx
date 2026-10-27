"use client";

import { useMemo, useState } from "react";
import { getStore, useData } from "@/lib/store";
import { addDays } from "@/lib/dates";
import { currentStreak, useTasksByDate } from "@/lib/derive";
import { dayStats } from "@/lib/score";
import { PRIORITIES, PRIORITY_LABEL, PRIORITY_RANK, type Priority, type Task } from "@/lib/types";
import { Card, Checkbox, Chip, IconButton, Icons, InlineText, NoteBox, Stat, tagColour } from "./ui";

export default function DayTab({ date }: { date: string }) {
  const data = useData();
  const store = getStore();
  const tasksByDate = useTasksByDate(data.tasks);
  const tasks = useMemo(() => tasksByDate.get(date) ?? [], [tasksByDate, date]);
  const day = data.days[date];
  const stats = dayStats(data.settings, day, tasks);

  const yesterday = addDays(date, -1);
  const carryOver = (tasksByDate.get(yesterday) ?? []).filter((t) => !t.done);

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Routine" value={`${stats.habitsDone}/${stats.habitsTotal}`} />
        <Stat label="Tasks" value={`${stats.tasksDone}/${stats.tasksTotal}`} />
        <Stat label="Day score" value={`${stats.score}%`} />
      </div>

      {carryOver.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-medium/40 bg-medium-soft px-4 py-3">
          <p className="font-bold">
            {carryOver.length} unfinished from the day before
          </p>
          <button
            type="button"
            onClick={() => store.moveTasks(carryOver.map((t) => t.id), date)}
            className="rounded-full bg-ink px-3.5 py-1.5 text-sm font-bold text-bg"
          >
            Move to this day
          </button>
        </div>
      )}

      <Card title="Daily routine">
        {data.settings.habits.length === 0 ? (
          <p className="text-muted">No habits yet. Add some in Setup.</p>
        ) : (
          <ul className="flex flex-col">
            {data.settings.habits.map((h) => {
              const done = day?.habits_done?.includes(h.id) ?? false;
              const streak = currentStreak(data.days, h.id, date);
              return (
                <li key={h.id} className="flex items-center gap-3 border-b border-line py-2.5 last:border-0">
                  <Checkbox checked={done} onChange={() => store.toggleHabit(date, h.id)} label={h.name} />
                  <button
                    type="button"
                    onClick={() => store.toggleHabit(date, h.id)}
                    className={`min-w-0 flex-1 text-left ${done ? "text-muted line-through" : ""}`}
                  >
                    {h.name}
                  </button>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${
                      streak > 0 ? "bg-accent-soft text-accent" : "text-muted"
                    }`}
                    title="Current streak"
                  >
                    {streak > 0 ? `${streak}-day streak` : "No streak"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <PlanCard date={date} tasks={tasks} />

      <Card title="Notes">
        <NoteBox
          value={day?.note ?? ""}
          onChange={(v) => store.setDayNote(date, v)}
          placeholder="How did the day go? Anything to remember?"
          rows={5}
          ariaLabel="Notes for the day"
        />
      </Card>
    </>
  );
}

function PlanCard({ date, tasks }: { date: string; tasks: Task[] }) {
  const data = useData();
  const store = getStore();
  const { categories } = data.settings;
  const [filter, setFilter] = useState<string | "all">("all");
  const [text, setText] = useState("");
  const [category, setCategory] = useState<string>("");
  const [priority, setPriority] = useState<Priority>("medium");

  const catIndex = (id: string | null) => categories.findIndex((c) => c.id === id);

  const visible = useMemo(() => {
    const list = filter === "all" ? tasks : tasks.filter((t) => t.category_id === filter);
    return [...list].sort(
      (a, b) =>
        Number(a.done) - Number(b.done) ||
        PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
        a.created_at.localeCompare(b.created_at),
    );
  }, [tasks, filter]);

  const defaultCategory = filter !== "all" ? filter : category || categories[0]?.id || "";

  function add(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    store.addTask(date, t, defaultCategory || null, priority);
    setText("");
  }

  function cycleCategory(task: Task) {
    if (categories.length === 0) return;
    const i = catIndex(task.category_id);
    const next = categories[(i + 1) % categories.length];
    store.updateTask(task.id, { category_id: next.id });
  }

  function cyclePriority(task: Task) {
    const next = PRIORITIES[(PRIORITIES.indexOf(task.priority) + 1) % PRIORITIES.length];
    store.updateTask(task.id, { priority: next });
  }

  const inputCls = "rounded-xl border border-line bg-bg px-3 py-2 outline-none focus:border-accent";

  return (
    <Card title="Plan for the day">
      <form onSubmit={add} className="flex flex-col gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a task…"
          aria-label="New task"
          className={`${inputCls} w-full`}
        />
        <div className="flex gap-2">
          <select
            value={defaultCategory}
            onChange={(e) => setCategory(e.target.value)}
            disabled={filter !== "all"}
            aria-label="Category"
            className={`${inputCls} min-w-0 flex-1`}
          >
            {categories.length === 0 && <option value="">No category</option>}
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            aria-label="Priority"
            className={`${inputCls} min-w-0 flex-1`}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABEL[p]}
              </option>
            ))}
          </select>
          <button type="submit" className="shrink-0 rounded-xl bg-accent px-4 py-2 font-bold text-accent-ink">
            Add
          </button>
        </div>
      </form>

      {categories.length > 0 && (
        <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4">
          <Chip active={filter === "all"} onClick={() => setFilter("all")}>
            All
          </Chip>
          {categories.map((c) => (
            <Chip key={c.id} active={filter === c.id} onClick={() => setFilter(c.id)}>
              {c.name}
            </Chip>
          ))}
        </div>
      )}

      <ul className="mt-3 flex flex-col">
        {visible.length === 0 && (
          <li className="py-4 text-center text-muted">
            {tasks.length === 0 ? "Nothing planned yet." : "No tasks in this category."}
          </li>
        )}
        {visible.map((t) => {
          const ci = catIndex(t.category_id);
          const cat = ci >= 0 ? categories[ci] : null;
          return (
            <li key={t.id} className="border-b border-line py-2.5 last:border-0">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={t.done}
                  onChange={() => store.updateTask(t.id, { done: !t.done })}
                  label={`Mark “${t.text}” as ${t.done ? "not done" : "done"}`}
                />
                <InlineText
                  value={t.text}
                  onCommit={(v) => store.updateTask(t.id, { text: v })}
                  strike={t.done}
                  ariaLabel="Task"
                  className="flex-1"
                />
                <IconButton label="Delete task" onClick={() => store.deleteTask(t.id)}>
                  {Icons.trash}
                </IconButton>
              </div>
              <div className="ml-8 mt-1 flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => cycleCategory(t)}
                  title="Tap to change category"
                  className="flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5 text-xs font-bold text-muted"
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: cat ? tagColour(ci) : "var(--line)" }} />
                  {cat?.name ?? "No category"}
                </button>
                <button
                  type="button"
                  onClick={() => cyclePriority(t)}
                  title="Tap to change priority"
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    t.priority === "high"
                      ? "bg-high-soft text-high"
                      : t.priority === "medium"
                        ? "bg-medium-soft text-medium"
                        : "bg-low-soft text-low"
                  }`}
                >
                  {PRIORITY_LABEL[t.priority]}
                </button>
                {t.moved_count > 0 && (
                  <span className="text-xs font-bold text-medium" title="Times carried over">
                    moved {t.moved_count}×
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
