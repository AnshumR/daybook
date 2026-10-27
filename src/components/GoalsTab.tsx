"use client";

import { useState } from "react";
import { getStore, useData } from "@/lib/store";
import { diffDays, formatShort, todayISO } from "@/lib/dates";
import { TIMEFRAMES, TIMEFRAME_LABEL, type Goal, type Timeframe } from "@/lib/types";
import type { Navigate } from "./App";
import { Card, Checkbox, Chip, IconButton, Icons, InlineText, ProgressBar } from "./ui";

type Filter = "all" | Timeframe | "done";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
  { id: "long", label: "Long term" },
  { id: "done", label: "Done" },
];

export default function GoalsTab({ navigate }: { navigate: Navigate }) {
  const data = useData();
  const store = getStore();
  const [filter, setFilter] = useState<Filter>("all");
  const [planned, setPlanned] = useState<string | null>(null);

  const goals = data.goals
    .filter((g) => {
      if (filter === "all") return true;
      if (filter === "done") return g.done;
      return !g.done && g.timeframe === filter;
    })
    .sort(
      (a, b) =>
        Number(a.done) - Number(b.done) ||
        (a.target_date ?? "9999").localeCompare(b.target_date ?? "9999") ||
        a.created_at.localeCompare(b.created_at),
    );

  function addGoal() {
    const timeframe: Timeframe = filter === "month" || filter === "year" || filter === "long" ? filter : "month";
    store.addGoal({ title: "New goal", timeframe });
    if (filter === "done") setFilter("all");
  }

  function planToday(g: Goal) {
    const text = g.next_step.trim();
    if (!text) return;
    store.addTask(todayISO(), text, data.settings.categories[0]?.id ?? null, "high");
    setPlanned(g.id);
    setTimeout(() => setPlanned((p) => (p === g.id ? null : p)), 2500);
  }

  return (
    <>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {FILTERS.map((f) => (
          <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </Chip>
        ))}
      </div>

      <button
        type="button"
        onClick={addGoal}
        className="rounded-2xl border-2 border-dashed border-line px-4 py-3 font-bold text-muted hover:border-accent hover:text-accent"
      >
        + Add a goal
      </button>

      {goals.length === 0 && <p className="py-6 text-center text-muted">No goals here yet.</p>}

      {goals.map((g) => (
        <GoalCard
          key={g.id}
          goal={g}
          planned={planned === g.id}
          onPlan={() => planToday(g)}
          onOpenToday={() => navigate("day", todayISO())}
        />
      ))}
    </>
  );
}

function GoalCard({
  goal: g,
  planned,
  onPlan,
  onOpenToday,
}: {
  goal: Goal;
  planned: boolean;
  onPlan: () => void;
  onOpenToday: () => void;
}) {
  const data = useData();
  const store = getStore();
  const today = todayISO();
  const left = g.target_date ? diffDays(today, g.target_date) : null;

  const field = "rounded-lg border border-line bg-bg px-2 py-1.5 text-sm outline-none focus:border-accent";

  return (
    <Card className={g.done ? "opacity-75" : ""}>
      <div className="flex items-center gap-2">
        <Checkbox
          checked={g.done}
          onChange={() => store.updateGoal(g.id, { done: !g.done })}
          label={`Mark goal as ${g.done ? "not done" : "done"}`}
        />
        <InlineText
          value={g.title}
          onCommit={(v) => store.updateGoal(g.id, { title: v })}
          placeholder="Goal title"
          ariaLabel="Goal title"
          strike={g.done}
          className="flex-1 font-display text-lg font-bold"
        />
        <IconButton
          label="Delete goal"
          onClick={() => {
            if (confirm(`Delete “${g.title || "this goal"}”?`)) store.deleteGoal(g.id);
          }}
        >
          {Icons.trash}
        </IconButton>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-bold text-muted">
          Area
          <select
            value={g.area_id ?? ""}
            onChange={(e) => store.updateGoal(g.id, { area_id: e.target.value || null })}
            className={`${field} text-ink`}
          >
            <option value="">None</option>
            {data.settings.areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold text-muted">
          Timeframe
          <select
            value={g.timeframe}
            onChange={(e) => store.updateGoal(g.id, { timeframe: e.target.value as Timeframe })}
            className={`${field} text-ink`}
          >
            {TIMEFRAMES.map((t) => (
              <option key={t} value={t}>
                {TIMEFRAME_LABEL[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="col-span-2 flex flex-col gap-1 text-xs font-bold text-muted sm:col-span-1">
          Target date
          <input
            type="date"
            value={g.target_date ?? ""}
            onChange={(e) => store.updateGoal(g.id, { target_date: e.target.value || null })}
            className={`${field} text-ink`}
          />
        </label>
      </div>

      <div className="mt-2 text-sm">
        {left === null ? (
          <span className="text-muted">No target date</span>
        ) : g.done ? (
          <span className="text-accent">Done · target {formatShort(g.target_date!)}</span>
        ) : left > 0 ? (
          <span className="text-muted">
            {left} {left === 1 ? "day" : "days"} left
          </span>
        ) : left === 0 ? (
          <span className="font-bold text-medium">Due today</span>
        ) : (
          <span className="font-bold text-high">
            {-left} {left === -1 ? "day" : "days"} overdue
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => store.updateGoal(g.id, { progress: Math.max(0, g.progress - 10) })}
          className="rounded-lg border border-line px-2 py-1 text-sm font-bold"
          aria-label="Decrease progress by 10%"
        >
          −10%
        </button>
        <div className="flex-1">
          <ProgressBar value={g.progress} />
        </div>
        <span className="w-10 text-right text-sm font-bold tabular-nums">{g.progress}%</span>
        <button
          type="button"
          onClick={() => store.updateGoal(g.id, { progress: Math.min(100, g.progress + 10) })}
          className="rounded-lg border border-line px-2 py-1 text-sm font-bold"
          aria-label="Increase progress by 10%"
        >
          +10%
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-2 rounded-xl bg-bg p-2 sm:flex-row sm:items-center">
        <span className="shrink-0 px-1 text-xs font-bold uppercase tracking-wide text-muted">Next step</span>
        <InlineText
          value={g.next_step}
          onCommit={(v) => store.updateGoal(g.id, { next_step: v })}
          placeholder="What’s the very next action?"
          ariaLabel="Next step"
          allowEmpty
          className="flex-1"
        />
        {planned ? (
          <button type="button" onClick={onOpenToday} className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-bold text-accent">
            Added to today ✓
          </button>
        ) : (
          <button
            type="button"
            onClick={onPlan}
            disabled={!g.next_step.trim()}
            className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-sm font-bold text-accent-ink disabled:opacity-40"
          >
            Plan it today
          </button>
        )}
      </div>
    </Card>
  );
}
