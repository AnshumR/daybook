"use client";

import { useEffect, useMemo, useState } from "react";
import { getStore, useData } from "@/lib/store";
import { todayISO } from "@/lib/dates";
import { currentStreak, useTasksByDate } from "@/lib/derive";
import { overdueTasks } from "@/lib/reminders";
import { dayStats, wordDoneOn, wordEnabled } from "@/lib/score";
import { PRIORITIES, PRIORITY_LABEL, PRIORITY_NAME, PRIORITY_RANK, type Priority, type Task } from "@/lib/types";
import { containsWord, wordForDate } from "@/lib/words";
import { Card, Checkbox, IconButton, InlineText, NoteBox, ProgressBar, tagColour } from "./ui";

export function useFocus(): string | null {
  const data = useData();
  const focus = data.settings.prefs?.focus ?? null;
  return focus && data.settings.categories.some((c) => c.id === focus) ? focus : null;
}

export default function DayTab({ date }: { date: string }) {
  const data = useData();
  const tasksByDate = useTasksByDate(data.tasks);
  const tasks = useMemo(() => tasksByDate.get(date) ?? [], [tasksByDate, date]);
  const day = data.days[date];
  const stats = dayStats(data.settings, day, tasks, date);
  const isToday = date === todayISO();

  return (
    <>
      <Summary stats={stats} />
      {isToday && <ReminderBanner tasks={tasks} />}
      <PlanCard date={date} tasks={tasks} isToday={isToday} />
      <RoutineCard date={date} />
      {wordEnabled(data.settings) && <WordCard date={date} />}
      <NotesCard date={date} />
    </>
  );
}

function Summary({ stats }: { stats: ReturnType<typeof dayStats> }) {
  const parts = [
    `Routine ${stats.habitsDone}/${stats.habitsTotal}`,
    `Tasks ${stats.tasksDone}/${stats.tasksTotal}`,
    ...(stats.wordCounts ? [`Word ${stats.wordDone ? "✓" : "–"}`] : []),
  ];
  return (
    <div className="rounded-2xl border border-line bg-card px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-muted">{parts.join("  ·  ")}</p>
        <p className="font-display text-2xl font-bold tabular-nums">
          {stats.score}
          <span className="text-base text-muted">%</span>
        </p>
      </div>
      <ProgressBar value={stats.score} className="mt-2" />
    </div>
  );
}

function ReminderBanner({ tasks }: { tasks: Task[] }) {
  const focus = useFocus();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const overdue = overdueTasks(tasks, focus, now);
  if (overdue.length === 0) return null;
  return (
    <div className="rounded-2xl border border-high/30 bg-high-soft px-4 py-3">
      <p className="font-bold text-high">
        ⏰ {overdue.length === 1 ? "1 important task has" : `${overdue.length} important tasks have`} been waiting 2+ hours
      </p>
      <p className="mt-0.5 truncate text-sm">{overdue.map((t) => t.text).join(" · ")}</p>
    </div>
  );
}

function PlanCard({ date, tasks, isToday }: { date: string; tasks: Task[]; isToday: boolean }) {
  const data = useData();
  const store = getStore();
  const { categories } = data.settings;
  const focus = useFocus();
  const focusName = categories.find((c) => c.id === focus)?.name;
  const [text, setText] = useState("");
  const [category, setCategory] = useState<string>("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [showDone, setShowDone] = useState(false);

  const catIndex = (id: string | null) => categories.findIndex((c) => c.id === id);
  const addCategory = focus ?? (category || categories[0]?.id || "");

  const { open, done } = useMemo(() => {
    const list = focus ? tasks.filter((t) => t.category_id === focus) : tasks;
    const sorted = [...list].sort(
      (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.created_at.localeCompare(b.created_at),
    );
    return { open: sorted.filter((t) => !t.done), done: sorted.filter((t) => t.done) };
  }, [tasks, focus]);

  function add(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    store.addTask(date, t, addCategory || null, priority);
    setText("");
  }

  const cycle = <T,>(list: T[], current: T) => list[(list.indexOf(current) + 1) % list.length];

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold tracking-tight">
          {focusName ? `${focusName} focus` : isToday ? "Today’s plan" : "Plan"}
        </h2>
        {categories.length > 0 && (
          <label className="flex items-center gap-1.5 text-sm text-muted">
            Focus
            <select
              value={focus ?? ""}
              onChange={(e) => store.updatePrefs({ focus: e.target.value || null })}
              className="rounded-full border border-line bg-bg px-3 py-1 text-sm font-bold text-ink outline-none focus:border-accent"
            >
              <option value="">Everything</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <form onSubmit={add}>
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={focusName ? `Add a ${focusName.toLowerCase()} task…` : "Add a task…"}
            aria-label="New task"
            className="min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 py-2 outline-none focus:border-accent"
          />
          <button type="submit" className="shrink-0 rounded-xl bg-accent px-4 py-2 font-bold text-accent-ink" aria-label="Add task">
            Add
          </button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <div className="flex overflow-hidden rounded-full border border-line" role="radiogroup" aria-label="Priority">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={priority === p}
                title={PRIORITY_NAME[p]}
                onClick={() => setPriority(p)}
                className={`px-3 py-1 font-bold ${priority === p ? priorityClass(p) : "text-muted"}`}
              >
                {PRIORITY_LABEL[p]}
              </button>
            ))}
          </div>
          {!focus && categories.length > 0 && (
            <select
              value={addCategory}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Category"
              className="rounded-full border border-line bg-card px-3 py-1 font-bold text-muted outline-none focus:border-accent"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </form>

      <ul className="mt-3 flex flex-col">
        {open.length === 0 && (
          <li className="py-4 text-center text-muted">
            {done.length ? "All done. Nice work! 🎉" : focusName ? `No ${focusName.toLowerCase()} tasks yet.` : "Nothing planned yet."}
          </li>
        )}
        {open.map((t) => (
          <TaskRow key={t.id} task={t} showCategory={!focus} catIndex={catIndex(t.category_id)} cycle={cycle} />
        ))}
      </ul>

      {done.length > 0 && (
        <div className="mt-2 border-t border-line pt-2">
          <button type="button" onClick={() => setShowDone((v) => !v)} className="text-sm font-bold text-muted">
            {showDone ? "Hide" : "Show"} done ({done.length})
          </button>
          {showDone && (
            <ul className="mt-1 flex flex-col">
              {done.map((t) => (
                <TaskRow key={t.id} task={t} showCategory={!focus} catIndex={catIndex(t.category_id)} cycle={cycle} />
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}

function priorityClass(p: Priority) {
  return p === "high" ? "bg-high-soft text-high" : p === "medium" ? "bg-medium-soft text-medium" : "bg-low-soft text-low";
}

function TaskRow({
  task: t,
  showCategory,
  catIndex,
  cycle,
}: {
  task: Task;
  showCategory: boolean;
  catIndex: number;
  cycle: <T>(list: T[], current: T) => T;
}) {
  const data = useData();
  const store = getStore();
  const { categories } = data.settings;
  const cat = catIndex >= 0 ? categories[catIndex] : null;
  const showMeta = (showCategory && categories.length > 0) || t.moved_count > 0;

  return (
    <li className="border-b border-line py-2 last:border-0">
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
        <button
          type="button"
          onClick={() => store.updateTask(t.id, { priority: cycle(PRIORITIES, t.priority) })}
          title={`${PRIORITY_NAME[t.priority]} (tap to change)`}
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${priorityClass(t.priority)}`}
        >
          {PRIORITY_LABEL[t.priority]}
        </button>
        <IconButton label="Delete task" onClick={() => store.deleteTask(t.id)} className="h-7 w-7">
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden="true">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </IconButton>
      </div>
      {showMeta && (
        <div className="ml-8 mt-0.5 flex items-center gap-2 text-xs text-muted">
          {showCategory && categories.length > 0 && (
            <button
              type="button"
              onClick={() => store.updateTask(t.id, { category_id: cycle(categories, cat ?? categories[categories.length - 1]).id })}
              title="Tap to change category"
              className="flex items-center gap-1 font-bold"
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: cat ? tagColour(catIndex) : "var(--line)" }} />
              {cat?.name ?? "No category"}
            </button>
          )}
          {t.moved_count > 0 && <span className="font-bold text-medium">moved {t.moved_count}×</span>}
        </div>
      )}
    </li>
  );
}

function RoutineCard({ date }: { date: string }) {
  const data = useData();
  const store = getStore();
  const day = data.days[date];
  const habits = data.settings.habits;
  const doneCount = habits.filter((h) => day?.habits_done?.includes(h.id)).length;

  return (
    <Card title="Routine" action={<span className="text-sm font-bold tabular-nums text-muted">{doneCount}/{habits.length}</span>}>
      {habits.length === 0 ? (
        <p className="text-muted">No habits yet. Add some in Setup.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {habits.map((h) => {
            const done = day?.habits_done?.includes(h.id) ?? false;
            const streak = currentStreak(data.days, h.id, date);
            return (
              <button
                key={h.id}
                type="button"
                role="checkbox"
                aria-checked={done}
                onClick={() => store.toggleHabit(date, h.id)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-bold transition-colors ${
                  done ? "border-accent bg-accent text-accent-ink" : "border-line bg-bg text-ink"
                }`}
              >
                {done && <span aria-hidden="true">✓</span>}
                {h.name}
                {streak > 1 && (
                  <span className={`text-xs ${done ? "opacity-80" : "text-muted"}`} title={`${streak}-day streak`}>
                    🔥{streak}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function WordCard({ date }: { date: string }) {
  const data = useData();
  const store = getStore();
  const day = data.days[date];
  const w = wordForDate(date);
  const sentence = day?.word_sentence ?? "";
  const learned = wordDoneOn(day, date);
  const typed = sentence.trim().length > 0;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-accent">Word of the day</p>
          <p className="mt-1 font-display text-2xl font-bold">
            {w.word} <span className="text-sm font-normal text-muted">{w.pos}</span>
          </p>
        </div>
        {learned && <span className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-accent-ink">✓ Learned</span>}
      </div>
      <p className="mt-1 text-lg" lang="hi">
        {w.hindi}
      </p>
      <p className="text-sm text-muted">
        {w.meaning}. <em>“{w.example}”</em>
      </p>
      <textarea
        value={sentence}
        onChange={(e) => store.setWordSentence(date, e.target.value)}
        rows={2}
        placeholder={`Write your own sentence using “${w.word}”…`}
        aria-label={`Your sentence using ${w.word}`}
        className="mt-3 block w-full resize-y rounded-xl border border-line bg-bg px-3 py-2 outline-none focus:border-accent"
      />
      {typed && !learned && (
        <p className="mt-1 text-xs text-muted">
          {containsWord(sentence, w.word) ? "Make it a full sentence (3+ words)." : `Use “${w.word}” in your sentence to tick it off.`}
        </p>
      )}
    </Card>
  );
}

function NotesCard({ date }: { date: string }) {
  const data = useData();
  const store = getStore();
  const note = data.days[date]?.note ?? "";
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 text-left" aria-expanded={open}>
        <span className="text-lg font-bold tracking-tight font-display">Notes</span>
        <span className="text-sm font-bold text-muted">{open ? "Close" : note.trim() ? "Edit" : "Add"}</span>
      </button>
      {!open && note.trim() && <p className="mt-2 line-clamp-2 text-sm text-muted">{note}</p>}
      {open && (
        <div className="mt-2">
          <NoteBox value={note} onChange={(v) => store.setDayNote(date, v)} placeholder="How did the day go? Anything to remember?" rows={5} ariaLabel="Notes for the day" />
        </div>
      )}
    </Card>
  );
}
