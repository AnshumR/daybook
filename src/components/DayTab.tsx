"use client";

import { useEffect, useMemo, useState } from "react";
import { getStore, useData } from "@/lib/store";
import { formatLong, todayISO } from "@/lib/dates";
import { currentStreak, useTasksByDate } from "@/lib/derive";
import { describePlanned, formatClock, formatMinutes, plannedAt } from "@/lib/insights";
import { dueReminders, formatReminder, overdueTasks } from "@/lib/reminders";
import ReminderPicker from "./ReminderPicker";
import { useMinute } from "./BacklogTab";
import { dayReport, timerSeconds } from "@/lib/report";
import { dayStats, wordDoneOn, wordEnabled, wordLevel } from "@/lib/score";
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
      {isToday && <DueReminders />}
      {isToday && <ReminderBanner tasks={tasks} />}
      <NowWorking tasks={tasks} />
      <PlanCard date={date} tasks={tasks} isToday={isToday} />
      <HabitsCard date={date} />
      <DontsCard date={date} />
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
          {stats.habitsDone + stats.tasksDone + (stats.wordDone ? 1 : 0) + stats.dontsKept} of{" "}
          {stats.habitsTotal + stats.tasksTotal + (stats.wordCounts ? 1 : 0) + stats.dontsTotal} things done
        </p>
        <p className="text-sm text-muted">{bits.join(" · ")}</p>
      </div>
      <Ring value={stats.score} />
    </div>
  );
}

/** Reminders that are due now, from the backlog or any day. */
function DueReminders() {
  const data = useData();
  const store = getStore();
  const now = useMinute();
  const due = dueReminders(data.tasks, new Date(now));
  if (due.length === 0) return null;
  const today = todayISO();
  const btn = "rounded-full px-3 py-1.5 text-xs font-extrabold";
  return (
    <div className="flex flex-col gap-2 rounded-[22px] bg-medium-soft px-4 py-3">
      <p className="font-extrabold text-medium">⏰ {due.length === 1 ? "Reminder" : `${due.length} reminders`}</p>
      {due.map((t) => (
        <div key={t.id} className="flex flex-wrap items-center gap-2">
          <span className="min-w-0 flex-1 font-semibold">{t.text}</span>
          {t.date !== today && (
            <button
              type="button"
              className={`${btn} bg-accent text-accent-ink`}
              onClick={() => {
                store.pickForDay(t.id, today);
                store.setReminder(t.id, null);
              }}
            >
              Add to today
            </button>
          )}
          <button type="button" className={`${btn} bg-card`} onClick={() => store.setReminder(t.id, new Date(Date.now() + 3600_000).toISOString())}>
            Snooze 1h
          </button>
          <button type="button" className={`${btn} bg-card`} onClick={() => store.setReminder(t.id, null)}>
            Done with reminder
          </button>
        </div>
      ))}
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

/** Live seconds for a running timer, ticking once a second. */
function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

function formatTimer(secs: number): string {
  const s = Math.floor(secs);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}` : `${m}:${String(r).padStart(2, "0")}`;
}

function NowWorking({ tasks }: { tasks: Task[] }) {
  const store = getStore();
  const running = tasks.find((t) => t.running_since);
  const now = useNow(!!running);
  if (!running) return null;
  return (
    <div className="sticky top-16 z-10 flex items-center gap-3 rounded-[22px] bg-ink px-4 py-3 text-bg shadow-lg">
      <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold opacity-75">Working on</p>
        <p className="truncate font-extrabold">{running.text}</p>
      </div>
      <span className="font-display text-xl font-bold tabular-nums" aria-label="Time on this task">
        {formatTimer(timerSeconds(running, now))}
      </span>
      <button type="button" onClick={() => store.pauseTask(running.id)} className="rounded-full bg-bg/15 px-3 py-1.5 text-sm font-extrabold">
        Pause
      </button>
      <button type="button" onClick={() => store.setTaskDone(running.id, true)} className="rounded-full bg-accent px-3 py-1.5 text-sm font-extrabold text-accent-ink">
        Finish
      </button>
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
  const [priority, setPriority] = useState<Priority>("medium");
  const [showDone, setShowDone] = useState(false);
  const [openRow, setOpenRow] = useState<string | null>(null);

  const catIndex = (id: string | null) => categories.findIndex((c) => c.id === id);
  const addCategory = focus ?? categories[0]?.id ?? "";
  const byPosition = (a: Task, b: Task) => (a.position ?? 0) - (b.position ?? 0) || a.created_at.localeCompare(b.created_at);

  const { open, done } = useMemo(() => {
    const list = focus ? tasks.filter((t) => t.category_id === focus) : tasks;
    return {
      open: list.filter((t) => !t.done).sort(byPosition),
      done: list.filter((t) => t.done).sort((a, b) => (a.done_at ?? "").localeCompare(b.done_at ?? "")),
    };
  }, [tasks, focus]);

  const openCount = (catId: string | null) => tasks.filter((t) => !t.done && (catId === null || t.category_id === catId)).length;

  function add(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    store.addTask(date, t, addCategory || null, priority);
    setText("");
  }

  function move(id: string, dir: -1 | 1) {
    const ids = open.map((t) => t.id);
    const i = ids.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    store.reorderTasks(ids);
  }

  function sortByPriority() {
    store.reorderTasks([...open].sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || byPosition(a, b)).map((t) => t.id));
  }

  const total = open.length + done.length;

  return (
    <Card>
      {categories.length > 0 && (
        <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4" role="tablist" aria-label="Category">
          {[{ id: null as string | null, name: "All" }, ...categories].map((c) => {
            const active = (c.id ?? null) === focus;
            const n = openCount(c.id);
            return (
              <button
                key={c.id ?? "all"}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => store.updatePrefs({ focus: c.id })}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-extrabold ${
                  active ? "bg-ink text-bg" : "bg-bg text-muted"
                }`}
              >
                {c.name}
                {n > 0 && <span className={`text-xs ${active ? "opacity-75" : ""}`}>{n}</span>}
              </button>
            );
          })}
        </div>
      )}

      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{focusName ?? (isToday ? "Today’s plan" : "Plan")}</h2>
        <div className="flex items-center gap-3">
          {open.length > 1 && (
            <button type="button" onClick={sortByPriority} className="text-xs font-extrabold text-accent">
              Sort by priority
            </button>
          )}
          {total > 0 && (
            <span className="text-sm font-bold text-muted">
              {done.length}/{total}
            </span>
          )}
        </div>
      </div>

      <ol className="flex flex-col">
        {open.length === 0 && (
          <li className="pb-2 text-muted">
            {done.length ? "All done here. Lovely work." : focusName ? `Nothing in ${focusName} yet.` : "Nothing planned yet."}
          </li>
        )}
        {open.map((t, i) => (
          <TaskRow
            key={t.id}
            task={t}
            number={i + 1}
            showCategory={!focus}
            catIndex={catIndex(t.category_id)}
            expanded={openRow === t.id}
            onToggleMenu={() => setOpenRow((r) => (r === t.id ? null : t.id))}
            onMove={(dir) => move(t.id, dir)}
            first={i === 0}
            last={i === open.length - 1}
          />
        ))}
      </ol>

      <form onSubmit={add} className="mt-2">
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={focusName ? `Add to ${focusName}…` : "Add something for today…"}
            aria-label="New task"
            className="min-w-0 flex-1 rounded-2xl border-[1.5px] border-dashed border-line bg-bg px-3 py-2.5 outline-none placeholder:text-muted focus:border-solid focus:border-accent"
          />
          <button type="submit" className="shrink-0 rounded-2xl bg-accent px-4 py-2 font-extrabold text-accent-ink" aria-label="Add task">
            Add
          </button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <div className="flex shrink-0 overflow-hidden rounded-full bg-bg" role="radiogroup" aria-label="Priority">
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
            <span className="text-xs text-muted">Adds to {categories.find((c) => c.id === addCategory)?.name}</span>
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
                <DoneRow key={t.id} task={t} />
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
  number,
  showCategory,
  catIndex,
  expanded,
  onToggleMenu,
  onMove,
  first,
  last,
}: {
  task: Task;
  number: number;
  showCategory: boolean;
  catIndex: number;
  expanded: boolean;
  onToggleMenu: () => void;
  onMove: (dir: -1 | 1) => void;
  first: boolean;
  last: boolean;
}) {
  const data = useData();
  const store = getStore();
  const { categories } = data.settings;
  const cat = catIndex >= 0 ? categories[catIndex] : null;
  const running = !!t.running_since;
  const now = useNow(running);
  const secs = timerSeconds(t, now);
  const cycle = <T,>(list: T[], current: T) => list[(list.indexOf(current) + 1) % list.length];
  const pill = "rounded-full bg-bg px-3 py-1.5 text-xs font-extrabold";

  return (
    <li className={`rounded-2xl px-1 py-1.5 ${running ? "bg-accent-soft" : ""}`}>
      <div className="flex items-center gap-2.5">
        <span className="w-5 shrink-0 text-center font-display text-base font-bold text-muted tabular-nums">{number}</span>
        <Checkbox checked={false} onChange={() => store.setTaskDone(t.id, true)} label={`Mark “${t.text}” as done`} />
        <div className="min-w-0 flex-1">
          <InlineText value={t.text} onCommit={(v) => store.updateTask(t.id, { text: v })} ariaLabel="Task" className="w-full text-[16px] font-semibold" />
          <div className="flex flex-wrap items-center gap-x-2 px-1 text-xs text-muted">
            <span className={`rounded-full px-1.5 font-extrabold ${priorityClass(t.priority)}`}>{PRIORITY_LABEL[t.priority]}</span>
            {showCategory && cat && (
              <span className="flex items-center gap-1 font-bold">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: tagColour(catIndex) }} />
                {cat.name}
              </span>
            )}
            {t.recurring_id && <span className="font-bold">daily</span>}
            {secs >= 1 && <span className="font-bold tabular-nums text-ink">{running ? formatTimer(secs) : formatMinutes(secs / 60)}</span>}
            {t.moved_count > 0 && <span className="font-bold text-medium">moved {t.moved_count}×</span>}
            {t.remind_at && <span className="font-bold">⏰ {formatReminder(t.remind_at)}</span>}
          </div>
        </div>
        {running ? (
          <button type="button" onClick={() => store.pauseTask(t.id)} className="shrink-0 rounded-full bg-ink px-3 py-1.5 text-xs font-extrabold text-bg" aria-label={`Pause ${t.text}`}>
            Pause
          </button>
        ) : (
          <button type="button" onClick={() => store.startTask(t.id)} className="shrink-0 rounded-full bg-bg px-3 py-1.5 text-xs font-extrabold text-ink ring-[1.5px] ring-line ring-inset" aria-label={`${secs >= 1 ? "Resume" : "Start"} ${t.text}`}>
            {secs >= 1 ? "Resume" : "Start"}
          </button>
        )}
        <IconButton label={`More for ${t.text}`} onClick={onToggleMenu} className="h-8 w-8">
          <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
            <circle cx="4" cy="10" r="1.6" fill="currentColor" />
            <circle cx="10" cy="10" r="1.6" fill="currentColor" />
            <circle cx="16" cy="10" r="1.6" fill="currentColor" />
          </svg>
        </IconButton>
      </div>
      {expanded && (
        <div className="ml-8 mt-2 flex flex-wrap gap-1.5">
          <button type="button" className={pill} onClick={() => onMove(-1)} disabled={first} aria-label="Move up">↑ Up</button>
          <button type="button" className={pill} onClick={() => onMove(1)} disabled={last} aria-label="Move down">↓ Down</button>
          <button type="button" className={pill} onClick={() => store.updateTask(t.id, { priority: cycle(PRIORITIES, t.priority) })}>
            Priority: {PRIORITY_LABEL[t.priority]}
          </button>
          {categories.length > 0 && (
            <button
              type="button"
              className={pill}
              onClick={() => store.updateTask(t.id, { category_id: cycle(categories, cat ?? categories[categories.length - 1]).id })}
            >
              Category: {cat?.name ?? "None"}
            </button>
          )}
          <button type="button" className={pill} onClick={() => store.carryToTomorrow(t.id)}>
            Carry to tomorrow
          </button>
          <button type="button" className={pill} onClick={() => store.sendToBacklog(t.id)}>
            Send to backlog
          </button>
          <button type="button" className={`${pill} text-high`} onClick={() => store.deleteTask(t.id)}>
            Remove
          </button>
          <div className="w-full">
            <p className="mb-1 text-xs font-extrabold text-muted">Remind me</p>
            <ReminderPicker value={t.remind_at} onChange={(iso) => store.setReminder(t.id, iso)} />
          </div>
        </div>
      )}
    </li>
  );
}

function DoneRow({ task: t }: { task: Task }) {
  const store = getStore();
  const secs = timerSeconds(t);
  const info = [t.done_at ? `done ${formatClock(new Date(t.done_at))}` : "", secs >= 60 ? formatMinutes(secs / 60) : ""].filter(Boolean).join(" · ");
  return (
    <li className="flex items-center gap-2.5 px-1 py-1.5">
      <span className="w-5 shrink-0" />
      <Checkbox checked onChange={() => store.setTaskDone(t.id, false)} label={`Mark “${t.text}” as not done`} />
      <div className="min-w-0 flex-1">
        <p className="truncate px-1 text-muted line-through">{t.text}</p>
        {info && <p className="px-1 text-xs font-bold text-done">{info}</p>}
      </div>
      <IconButton label={`Remove ${t.text}`} onClick={() => store.deleteTask(t.id)} className="h-7 w-7">
        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden="true">
          <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </IconButton>
    </li>
  );
}

function DontsCard({ date }: { date: string }) {
  const data = useData();
  const store = getStore();
  const donts = data.settings.donts ?? [];
  const results = data.days[date]?.donts ?? {};
  if (donts.length === 0) return null;
  const kept = donts.filter((d) => results[d.id] === "kept").length;
  return (
    <Card title="Don’t list" action={<span className="text-sm font-bold text-muted">{kept} of {donts.length} avoided</span>}>
      <ul className="flex flex-col gap-2">
        {donts.map((d) => {
          const r = results[d.id];
          return (
            <li key={d.id} className="flex items-center justify-between gap-3">
              <span className={`min-w-0 flex-1 font-semibold ${r === "slipped" ? "text-high" : ""}`}>{d.name}</span>
              <div className="flex shrink-0 overflow-hidden rounded-full bg-bg" role="radiogroup" aria-label={d.name}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={r === "kept"}
                  onClick={() => store.setDont(date, d.id, r === "kept" ? null : "kept")}
                  className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${r === "kept" ? "bg-done text-card" : "text-muted"}`}
                >
                  Avoided
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={r === "slipped"}
                  onClick={() => store.setDont(date, d.id, r === "slipped" ? null : "slipped")}
                  className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${r === "slipped" ? "bg-high text-card" : "text-muted"}`}
                >
                  Slipped
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
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
            const at = done ? day?.habit_times?.[h.id] : undefined;
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
                {at && <span className="text-xs opacity-85">· {formatClock(new Date(at))}</span>}
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
  const w = wordForDate(date, wordLevel(data.settings));
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
