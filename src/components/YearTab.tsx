"use client";

import { getStore, useData } from "@/lib/store";
import { formatMonthShort, formatShort, monthDates, todayISO, weekdayIndex } from "@/lib/dates";
import { useTasksByDate } from "@/lib/derive";
import { average, dayStats, scoreLevel } from "@/lib/score";
import type { Navigate } from "./App";
import { Legend } from "./MonthTab";
import { Card, HEAT_CLASS, NoteBox, ProgressBar, Stat } from "./ui";

export default function YearTab({ date, navigate }: { date: string; navigate: Navigate }) {
  const data = useData();
  const store = getStore();
  const tasksByDate = useTasksByDate(data.tasks);
  const year = Number(date.slice(0, 4));
  const today = todayISO();

  const months = Array.from({ length: 12 }, (_, i) => {
    const dates = monthDates(year, i + 1);
    return { month1: i + 1, dates, stats: dates.map((d) => dayStats(data.settings, data.days[d], tasksByDate.get(d) ?? [], d)) };
  });
  const all = months.flatMap((m) => m.stats);
  const logged = all.filter((s) => s.logged);
  const tasksDone = all.reduce((n, s) => n + s.tasksDone, 0);

  const goalsDue = data.goals
    .filter((g) => g.target_date?.startsWith(String(year)))
    .sort((a, b) => (a.target_date ?? "").localeCompare(b.target_date ?? ""));
  const areaName = (id: string | null) => data.settings.areas.find((a) => a.id === id)?.name;

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Avg score" value={`${average(logged.map((s) => s.score))}%`} />
        <Stat label="Days logged" value={logged.length} />
        <Stat label="Tasks done" value={tasksDone} />
      </div>

      <Card title="Year at a glance">
        <div className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-4">
          {months.map(({ month1, dates, stats }) => {
            const lead = weekdayIndex(dates[0]);
            return (
              <button
                key={month1}
                type="button"
                onClick={() => navigate("month", `${year}-${String(month1).padStart(2, "0")}-01`)}
                className="self-start rounded-lg p-1 text-left hover:bg-bg"
                aria-label={`Open ${formatMonthShort(month1)} ${year}`}
              >
                <div className="mb-1 text-sm font-bold">{formatMonthShort(month1)}</div>
                <div className="grid grid-cols-7 gap-[2px]">
                  {Array.from({ length: lead }, (_, i) => (
                    <span key={`p${i}`} />
                  ))}
                  {dates.map((d, i) => (
                    <span
                      key={d}
                      title={formatShort(d)}
                      className={`aspect-square rounded-[2px] ${HEAT_CLASS[scoreLevel(stats[i])]} ${
                        d === today ? "outline outline-1 outline-ink" : ""
                      }`}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
        <Legend />
      </Card>

      <Card title="Theme and intentions">
        <NoteBox
          value={data.yearNotes[year]?.theme ?? ""}
          onChange={(v) => store.setYearTheme(year, v)}
          placeholder={`What is ${year} about for you?`}
          ariaLabel="Theme and intentions"
        />
      </Card>

      <Card
        title={`Goals due in ${year}`}
        action={
          <button type="button" onClick={() => navigate("goals")} className="text-sm font-bold text-accent">
            All goals
          </button>
        }
      >
        {goalsDue.length === 0 ? (
          <p className="text-muted">No goals with a target date this year.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {goalsDue.map((g) => (
              <li key={g.id}>
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className={`truncate ${g.done ? "text-muted line-through" : ""}`}>{g.title || "Untitled goal"}</span>
                  <span className="shrink-0 text-xs text-muted">
                    {[areaName(g.area_id), g.target_date && formatShort(g.target_date), `${g.progress}%`]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
                <ProgressBar value={g.progress} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
