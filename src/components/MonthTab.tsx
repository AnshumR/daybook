"use client";

import { getStore, useData } from "@/lib/store";
import { formatShort, monthDates, todayISO, WEEKDAY_INITIALS, weekdayIndex } from "@/lib/dates";
import { habitDone, useTasksByDate } from "@/lib/derive";
import { average, dayStats, scoreLevel } from "@/lib/score";
import type { Navigate } from "./App";
import { Card, HEAT_CLASS, NoteBox, ProgressBar, Stat } from "./ui";

export default function MonthTab({ date, navigate }: { date: string; navigate: Navigate }) {
  const data = useData();
  const store = getStore();
  const tasksByDate = useTasksByDate(data.tasks);
  const year = Number(date.slice(0, 4));
  const month1 = Number(date.slice(5, 7));
  const month = date.slice(0, 7);
  const dates = monthDates(year, month1);
  const today = todayISO();

  const stats = dates.map((d) => dayStats(data.settings, data.days[d], tasksByDate.get(d) ?? [], d));
  const logged = stats.filter((s) => s.logged);
  const avg = average(logged.map((s) => s.score));
  const fullDays = stats.filter((s) => s.logged && s.score === 100).length;
  const tasksDone = stats.reduce((n, s) => n + s.tasksDone, 0);

  // Habit % counts only days that have started (up to today).
  const elapsed = dates.filter((d) => d <= today);
  const note = data.monthNotes[month] ?? { month, focus: "", review: "" };
  const lead = weekdayIndex(dates[0]);

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Avg score" value={`${avg}%`} sub={`${logged.length} days logged`} />
        <Stat label="Full days" value={fullDays} sub="100% days" />
        <Stat label="Tasks done" value={tasksDone} />
      </div>

      <Card title="Month at a glance">
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {WEEKDAY_INITIALS.map((w, i) => (
            <div key={i} className="text-xs font-bold text-muted">
              {w}
            </div>
          ))}
          {Array.from({ length: lead }, (_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {dates.map((d, i) => {
            const s = stats[i];
            const level = scoreLevel(s);
            return (
              <button
                key={d}
                type="button"
                onClick={() => navigate("day", d)}
                title={`${formatShort(d)}: ${s.logged ? `${s.score}%` : "nothing logged"}`}
                className={`aspect-square rounded-lg text-sm font-bold tabular-nums ${HEAT_CLASS[level]} ${
                  level >= 3 ? "text-accent-ink" : "text-ink"
                } ${d === today ? "ring-2 ring-ink ring-offset-1 ring-offset-card" : ""} ${d > today ? "opacity-50" : ""}`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
        <Legend />
      </Card>

      <Card title="Habits this month">
        <ul className="flex flex-col gap-3">
          {data.settings.habits.map((h) => {
            const count = elapsed.filter((d) => habitDone(data.days, d, h.id)).length;
            const pct = elapsed.length ? Math.round((count / elapsed.length) * 100) : 0;
            return (
              <li key={h.id}>
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="truncate">{h.name}</span>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-muted">{pct}%</span>
                </div>
                <ProgressBar value={pct} />
              </li>
            );
          })}
        </ul>
      </Card>

      <Card title="Focus for the month">
        <NoteBox
          value={note.focus}
          onChange={(v) => store.setMonthNote(month, "focus", v)}
          placeholder="What matters most this month?"
          ariaLabel="Focus for the month"
        />
      </Card>

      <Card title="Month review">
        <NoteBox
          value={note.review}
          onChange={(v) => store.setMonthNote(month, "review", v)}
          placeholder="What went well? What would you change?"
          ariaLabel="Month review"
        />
      </Card>
    </>
  );
}

export function Legend() {
  return (
    <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-muted">
      Less
      {HEAT_CLASS.map((c) => (
        <span key={c} className={`h-3 w-3 rounded-sm ${c}`} />
      ))}
      More
    </div>
  );
}
