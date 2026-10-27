"use client";

import { getStore, useData } from "@/lib/store";
import { addDays, formatShort, formatWeekdayShort, startOfWeek, todayISO } from "@/lib/dates";
import { habitDone, useTasksByDate } from "@/lib/derive";
import { dayStats } from "@/lib/score";
import type { Navigate } from "./App";
import { Card, ProgressBar } from "./ui";

export default function WeekTab({ date, navigate }: { date: string; navigate: Navigate }) {
  const data = useData();
  const store = getStore();
  const tasksByDate = useTasksByDate(data.tasks);
  const start = startOfWeek(date);
  const week = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const today = todayISO();
  const stats = week.map((d) => dayStats(data.settings, data.days[d], tasksByDate.get(d) ?? [], d));

  // 30-day consistency up to the selected day (never past today).
  const end = date > today ? today : date;
  const last30 = Array.from({ length: 30 }, (_, i) => addDays(end, -29 + i));

  return (
    <>
      <Card title="Habits this week">
        <div className="grid grid-cols-7 gap-1.5">
          {week.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => navigate("day", d)}
              className={`flex flex-col items-center rounded-lg py-1 ${d === today ? "bg-accent-soft text-accent" : "text-muted"}`}
              title={`Open ${formatShort(d)}`}
            >
              <span className="text-[11px] font-bold uppercase">{formatWeekdayShort(d).slice(0, 2)}</span>
              <span className="font-bold tabular-nums">{Number(d.slice(8))}</span>
            </button>
          ))}
        </div>

        <ul className="mt-1 flex flex-col">
          {data.settings.habits.map((h) => (
            <li key={h.id} className="border-b border-line py-2 last:border-0">
              <div className="mb-1.5 truncate text-sm">{h.name}</div>
              <div className="grid grid-cols-7 gap-1.5">
                {week.map((d) => {
                  const done = habitDone(data.days, d, h.id);
                  return (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={done}
                      aria-label={`${h.name}, ${formatShort(d)}`}
                      onClick={() => store.toggleHabit(d, h.id)}
                      className={`grid h-9 place-items-center rounded-lg border transition-colors ${
                        done ? "border-accent bg-accent text-accent-ink" : "border-line bg-bg"
                      }`}
                    >
                      {done && (
                        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
                          <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </li>
          ))}
          {data.settings.habits.length === 0 && <li className="py-2 text-muted">No habits yet. Add some in Setup.</li>}
        </ul>

        <div className="mt-3 border-t border-line pt-3">
          <div className="mb-1 text-xs font-bold uppercase tracking-wide text-muted">Day score</div>
          <div className="grid grid-cols-7 gap-1.5 text-center text-sm font-bold tabular-nums">
            {stats.map((s, i) => (
              <span key={week[i]}>{s.logged ? `${s.score}%` : "–"}</span>
            ))}
          </div>
          <div className="mb-1 mt-2 text-xs font-bold uppercase tracking-wide text-muted">Tasks done</div>
          <div className="grid grid-cols-7 gap-1.5 text-center text-sm tabular-nums text-muted">
            {stats.map((s, i) => (
              <span key={week[i]}>{s.tasksTotal ? `${s.tasksDone}/${s.tasksTotal}` : "–"}</span>
            ))}
          </div>
        </div>
      </Card>

      <Card title="30-day consistency" action={<span className="text-xs text-muted">to {formatShort(end)}</span>}>
        <ul className="flex flex-col gap-3">
          {data.settings.habits.map((h) => {
            const count = last30.filter((d) => habitDone(data.days, d, h.id)).length;
            const pct = Math.round((count / 30) * 100);
            return (
              <li key={h.id}>
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="truncate">{h.name}</span>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-muted">
                    {count}/30 · {pct}%
                  </span>
                </div>
                <ProgressBar value={pct} />
              </li>
            );
          })}
          {data.settings.habits.length === 0 && <li className="text-muted">No habits yet. Add some in Setup.</li>}
        </ul>
      </Card>
    </>
  );
}
