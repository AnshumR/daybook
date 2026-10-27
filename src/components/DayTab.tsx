"use client";

import { useEffect, useMemo, useState } from "react";
import { getStore, useData } from "@/lib/store";
import { formatLong, todayISO } from "@/lib/dates";
import { currentStreak, useTasksByDate } from "@/lib/derive";
import { describePlanned, formatMinutes, plannedAt } from "@/lib/insights";
import { overdueTasks } from "@/lib/reminders";
import { dayReport } from "@/lib/report";
import { dayStats, wordDoneOn, wordEnabled } from "@/lib/score";
import { partOfDay } from "@/lib/themes";
import { PRIORITIES, PRIORITY_LABEL, PRIORITY_NAME, PRIORITY_RANK, type Priority, type Task } from "@/lib/types";
import { containsWord, wordForDate } from "@/lib/words";
import { Card, Checkbox, IconButton, InlineText, Ring, tagColour } from "./ui";

export function useFocus(): string | null {
  const data = useData();
  const focus = data.settings.prefs?.focus ?? null;
  return focus && data.settings.categories.some((c) => c.id === focus) ? focus : null;
}

export default function DayTab({ date }: { date: string }) {
  const data = useData();
  const tasksByDate = useTasksByDate(data.tasks);
  const tasks = useMemo(() => tasksByDate.get(date) ?? [], [tasksByDate, date]);
  const isToday = date === todayISO();

  return (
    <>
      <Greeting date={date} tasks={tasks} isToday={isToday} />
      {isToday && <ReminderBanner tasks={tasks} />}
      <PlanCard date={date} tasks={tasks} isToday={isToday} />
      <HabitsCard date={date} />
      {wordEnabled(data.settings) && <WordCard date={date} />}
      <ReflectionCard date={date} isToday={isToday} />
      <ReportCard date={date} tasks={tasks} />
    </>
  );
}

function Greeting({ date, tasks, isToday }: { date: string; tasks: Task[]; isToday: boolean }) {
  const data = useData();
  const day = data.days[date];
  const stats = dayStats(data.settings, day, tasks, date);
  const [part, setPart] = useState<ReturnType<typeof partOfDay> | null>(null);
  useEffect(() => setPart(partOfDay()), []);

  const title = isToday
    ? `Good ${part ?? "day"}${data.name ? `, ${data.name}` : ""}`
    : formatLong(date).split(",")[0];
  const bits = [describePlanned(plannedAt(tasks, date))];
  if (day?.app_seconds && day.app_seconds >= 60) bits.push(`${formatMinutes(day.app_seconds / 60)} in Daybook`);

  return (
    <div className="flex items-center justify-between gap-4 px-1 pt-1">
      <div className="min-w-0">
        <h1 className="text-[28px] font-bold leading-tight">{title}</h1>
        <p className="mt-1 text-sm font-semibold text-muted">
          {stats.habitsDone + stats.tasksDone + (stats.wordDone ? 1 : 0)} of{" "}
          {stats.habitsTotal + stats.tasksTotal + (stats.wordCounts ? 1 : 0)} things done
        </p>
        <p className="text-sm text-muted">{bits.join(" · ")}</p>
      </div>
      <Ring value={stats.score} />
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
    <div className="rounded-[22px] bg-high-soft px-4 py-3">
      <p className="font-extrabold text-high">
        {overdue.length === 1 ? "1 important task has" : `${overdue.length} important tasks have`} been waiting 2+ hours
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
  const total = open.length + done.length;

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">
          {focusName ? `${focusName} focus` : isToday ? "Today’s plan" : "Plan"}
        </h2>
        {total > 0 && (
          <span className="text-sm font-bold text-muted">
            {done.length} of {total} done
          </span>
        )}
      </div>

      <ul className="flex flex-col">
        {open.length === 0 && (
          <li className="pb-3 text-muted">
            {done.length ? "All done. Lovely work." : focusName ? `No ${focusName.toLowerCase()} tasks yet.` : "Nothing planned yet."}
          </li>
        )}
        {open.map((t) => (
          <TaskRow key={t.id} task={t} showCategory={!focus} catIndex={catIndex(t.category_id)} cycle={cycle} />
        ))}
      </ul>

      <form onSubmit={add} className="mt-2">
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={focusName ? `Add a ${focusName.toLowerCase()} task…` : "Add something for today…"}
            aria-label="New task"
            className="min-w-0 flex-1 rounded-2xl border-[1.5px] border-dashed border-line bg-bg px-3 py-2.5 outline-none placeholder:text-muted focus:border-solid focus:border-accent"
          />
          <button type="submit" className="shrink-0 rounded-2xl bg-accent px-4 py-2 font-extrabold text-accent-ink" aria-label="Add task">
            Add
          </button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <div className="flex overflow-hidden rounded-full bg-bg" role="radiogroup" aria-label="Priority">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={priority === p}
                title={PRIORITY_NAME[p]}
                onClick={() => setPriority(p)}
                className={`rounded-full px-3 py-1 font-extrabold ${priority === p ? priorityClass(p) : "text-muted"}`}
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
              className="rounded-full bg-bg px-3 py-1 font-bold text-muted outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          {categories.length > 0 && (
            <label className="ml-auto flex items-center gap-1 text-muted">
              <span className="font-semibold">Focus</span>
              <select
                value={focus ?? ""}
                onChange={(e) => store.updatePrefs({ focus: e.target.value || null })}
                aria-label="Focus"
                className="rounded-full bg-bg px-3 py-1 font-extrabold text-ink outline-none"
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
      </form>

      {done.length > 0 && (
        <div className="mt-3 border-t border-line pt-2">
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
  return p === "high" ? "bg-accent text-accent-ink" : p === "medium" ? "bg-medium-soft text-medium" : "bg-low-soft text-low";
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
    <li className="py-1.5">
      <div className="flex items-center gap-3">
        <Checkbox
          checked={t.done}
          onChange={() => store.updateTask(t.id, { done: !t.done })}
          label={`Mark “${t.text}” as ${t.done ? "not done" : "done"}`}
        />
        <div className="min-w-0 flex-1">
          <InlineText
            value={t.text}
            onCommit={(v) => store.updateTask(t.id, { text: v })}
            strike={t.done}
            ariaLabel="Task"
            className="w-full text-[16px] font-semibold"
          />
          {showMeta && (
            <div className="flex items-center gap-2 px-1 text-xs text-muted">
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
        </div>
        <button
          type="button"
          onClick={() => store.updateTask(t.id, { priority: cycle(PRIORITIES, t.priority) })}
          title={`${PRIORITY_NAME[t.priority]} (tap to change)`}
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-extrabold ${priorityClass(t.priority)}`}
        >
          {PRIORITY_LABEL[t.priority]}
        </button>
        <IconButton label="Delete task" onClick={() => store.deleteTask(t.id)} className="h-7 w-7">
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden="true">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </IconButton>
      </div>
    </li>
  );
}

function HabitsCard({ date }: { date: string }) {
  const data = useData();
  const store = getStore();
  const day = data.days[date];
  const habits = data.settings.habits;
  const doneCount = habits.filter((h) => day?.habits_done?.includes(h.id)).length;

  return (
    <Card title="Little habits" action={<span className="text-sm font-bold tabular-nums text-muted">{doneCount} of {habits.length}</span>}>
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
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold transition-colors ${
                  done ? "bg-done text-card" : "bg-bg text-ink ring-[1.5px] ring-line ring-inset"
                }`}
              >
                {done && (
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
                    <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {h.name}
                {streak > 1 && <span className={`text-xs ${done ? "opacity-85" : "text-muted"}`}>· {streak} days</span>}
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
        <p className="text-xs font-extrabold uppercase tracking-widest text-done">Word of the day</p>
        {learned && <span className="shrink-0 rounded-full bg-done px-2.5 py-0.5 text-xs font-extrabold text-card">Learned</span>}
      </div>
      <p className="mt-1">
        <span className="font-display text-2xl font-bold">{w.word}</span> <span className="text-sm text-muted">{w.pos}</span>
      </p>
      <p className="mt-0.5 text-lg" lang="hi">
        {w.hindi}
      </p>
      <p className="text-sm text-muted">
        {w.meaning}. <em>“{w.example}”</em>
      </p>
      <textarea
        value={sentence}
        onChange={(e) => store.setWordSentence(date, e.target.value)}
        rows={2}
        placeholder={`Use “${w.word}” in your own sentence…`}
        aria-label={`Your sentence using ${w.word}`}
        className="mt-3 block w-full resize-y rounded-2xl border-[1.5px] border-dashed border-line bg-bg px-3 py-2 outline-none placeholder:text-muted focus:border-solid focus:border-accent"
      />
      {typed && !learned && (
        <p className="mt-1 text-xs text-muted">
          {containsWord(sentence, w.word) ? "Make it a full sentence (3+ words)." : `Use “${w.word}” in your sentence to tick it off.`}
        </p>
      )}
    </Card>
  );
}

function ReflectionCard({ date, isToday }: { date: string; isToday: boolean }) {
  const data = useData();
  const store = getStore();
  const day = data.days[date];
  const filled = !!(day?.went_well?.trim() || day?.improve?.trim() || day?.note?.trim() || day?.screen_minutes != null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    // Open by default in the evening, for past days, or once something is written.
    setOpen(filled || !isToday || new Date().getHours() >= 17);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const screen = day?.screen_minutes;
  const [hours, setHours] = useState("");
  const [mins, setMins] = useState("");
  // Fill the boxes when the day changes, never while the user is typing in them.
  useEffect(() => {
    setHours(screen != null ? String(Math.floor(screen / 60)) : "");
    setMins(screen != null ? String(screen % 60) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);
  function saveScreen(h: string, m: string) {
    if (h.trim() === "" && m.trim() === "") return store.setScreenMinutes(date, null);
    const total = (parseInt(h, 10) || 0) * 60 + (parseInt(m, 10) || 0);
    store.setScreenMinutes(date, Math.max(0, Math.min(1440, total)));
  }

  const field = "block w-full resize-y rounded-2xl border-[1.5px] border-dashed border-line bg-bg px-3 py-2 outline-none placeholder:text-muted focus:border-solid focus:border-accent";
  const num = "w-16 rounded-xl border-[1.5px] border-line bg-bg px-2 py-1.5 text-center outline-none focus:border-accent";

  return (
    <Card>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 text-left" aria-expanded={open}>
        <span className="font-display text-xl font-bold">{isToday ? "Evening reflection" : "Reflection"}</span>
        <span className="text-sm font-bold text-muted">{open ? "Close" : filled ? "Open" : "Write"}</span>
      </button>
      {!open && <p className="mt-1 text-sm text-muted">What went well, what to improve, screen time.</p>}
      {open && (
        <div className="mt-3 flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-extrabold">What went well?</span>
            <textarea rows={2} value={day?.went_well ?? ""} onChange={(e) => store.setDayText(date, "went_well", e.target.value)} placeholder="A win, big or small…" className={field} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-extrabold">What could be better tomorrow?</span>
            <textarea rows={2} value={day?.improve ?? ""} onChange={(e) => store.setDayText(date, "improve", e.target.value)} placeholder="One thing to do differently…" className={field} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-extrabold">Notes</span>
            <textarea rows={2} value={day?.note ?? ""} onChange={(e) => store.setDayNote(date, e.target.value)} placeholder="Anything else to remember?" aria-label="Notes for the day" className={field} />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-extrabold">Phone screen time</span>
            <input inputMode="numeric" value={hours} aria-label="Screen time hours" placeholder="0" onChange={(e) => setHours(e.target.value.replace(/\D/g, "").slice(0, 2))} onBlur={() => saveScreen(hours, mins)} className={num} />
            <span className="text-sm text-muted">h</span>
            <input inputMode="numeric" value={mins} aria-label="Screen time minutes" placeholder="0" onChange={(e) => setMins(e.target.value.replace(/\D/g, "").slice(0, 2))} onBlur={() => saveScreen(hours, mins)} className={num} />
            <span className="text-sm text-muted">min</span>
          </div>
          <p className="-mt-1 text-xs text-muted">Find it in iPhone Settings → Screen Time, or Android Settings → Digital Wellbeing.</p>
        </div>
      )}
    </Card>
  );
}

function ReportCard({ date, tasks }: { date: string; tasks: Task[] }) {
  const data = useData();
  const [state, setState] = useState<"idle" | "copied" | "shown">("idle");
  const report = () => dayReport(data.settings, data.days[date], tasks, date);

  async function copy() {
    const text = report();
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
      setTimeout(() => setState((s) => (s === "copied" ? "idle" : s)), 2500);
    } catch {
      setState("shown");
    }
  }
  async function share() {
    try {
      await navigator.share({ title: "My day in Daybook", text: report() });
    } catch {}
  }
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Day report</h2>
          <p className="text-sm text-muted">A summary to share or discuss.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void copy()} className="rounded-2xl bg-accent px-4 py-2 font-extrabold text-accent-ink">
            {state === "copied" ? "Copied ✓" : "Copy"}
          </button>
          {canShare && (
            <button type="button" onClick={() => void share()} className="rounded-2xl bg-bg px-4 py-2 font-extrabold">
              Share
            </button>
          )}
          <button type="button" onClick={() => setState((s) => (s === "shown" ? "idle" : "shown"))} className="rounded-2xl bg-bg px-4 py-2 font-extrabold">
            {state === "shown" ? "Hide" : "View"}
          </button>
        </div>
      </div>
      {state === "shown" && (
        <pre className="mt-3 whitespace-pre-wrap rounded-2xl bg-bg p-3 font-sans text-sm">{report()}</pre>
      )}
    </Card>
  );
}
