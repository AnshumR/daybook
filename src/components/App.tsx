"use client";

import { useCallback, useEffect, useState } from "react";
import { getStore, useStoreState, type SaveStatus } from "@/lib/store";
import {
  addDays,
  addMonths,
  addYears,
  formatLong,
  formatMonthYear,
  formatShort,
  isISODate,
  startOfWeek,
  todayISO,
  yearOf,
} from "@/lib/dates";
import { Icons } from "./ui";
import DayTab from "./DayTab";
import WeekTab from "./WeekTab";
import MonthTab from "./MonthTab";
import YearTab from "./YearTab";
import GoalsTab from "./GoalsTab";
import SetupTab from "./SetupTab";

export type Tab = "day" | "week" | "month" | "year" | "goals" | "setup";
const TABS: { id: Tab; label: string }[] = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
  { id: "goals", label: "Goals" },
  { id: "setup", label: "Setup" },
];

export type Navigate = (tab: Tab, date?: string) => void;

export default function App() {
  const state = useStoreState();
  const [tab, setTab] = useState<Tab>("day");
  const [date, setDate] = useState<string>("");

  useEffect(() => {
    getStore().start();
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab") as Tab | null;
    const d = params.get("date");
    if (t && TABS.some((x) => x.id === t)) setTab(t);
    setDate(isISODate(d) ? d : todayISO());
  }, []);

  useEffect(() => {
    if (!date) return;
    const params = new URLSearchParams();
    params.set("tab", tab);
    if (date !== todayISO()) params.set("date", date);
    window.history.replaceState(null, "", `/?${params.toString()}`);
  }, [tab, date]);

  const navigate: Navigate = useCallback((t, d) => {
    setTab(t);
    if (d) setDate(d);
    window.scrollTo({ top: 0 });
  }, []);

  if (!date || state.phase === "loading") {
    return (
      <div className="grid min-h-dvh place-items-center text-muted">
        <p>Opening your daybook…</p>
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <div className="mx-auto grid min-h-dvh max-w-[420px] place-items-center px-5 text-center">
        <div>
          <h1 className="text-2xl font-bold">Couldn’t load your daybook</h1>
          <p className="mt-2 text-muted">{state.message}</p>
          <button
            onClick={() => void getStore().reload()}
            className="mt-5 rounded-xl bg-accent px-5 py-3 font-bold text-accent-ink"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const today = todayISO();

  return (
    <div className="mx-auto min-h-dvh max-w-[680px] pb-safe">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/95 pt-safe backdrop-blur">
        <div className="flex items-center justify-between gap-3 px-4 pt-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-accent">Daybook</p>
            <h1 className="truncate text-xl font-bold tracking-tight">{headerTitle(tab, date)}</h1>
          </div>
          <SaveIndicator status={state.status} />
        </div>

        {(tab === "day" || tab === "week" || tab === "month" || tab === "year") && (
          <DateNav tab={tab} date={date} today={today} setDate={setDate} />
        )}

        <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2 pt-2" aria-label="Sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => navigate(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-bold ${
                tab === t.id ? "bg-ink text-bg" : "text-muted hover:bg-card hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex flex-col gap-4 px-4 py-4">
        {tab === "day" && <DayTab date={date} />}
        {tab === "week" && <WeekTab date={date} navigate={navigate} />}
        {tab === "month" && <MonthTab date={date} navigate={navigate} />}
        {tab === "year" && <YearTab date={date} navigate={navigate} />}
        {tab === "goals" && <GoalsTab navigate={navigate} />}
        {tab === "setup" && <SetupTab />}
      </main>
    </div>
  );
}

function headerTitle(tab: Tab, date: string): string {
  switch (tab) {
    case "day":
      return formatLong(date);
    case "week": {
      const start = startOfWeek(date);
      return `Week of ${formatShort(start)} – ${formatShort(addDays(start, 6))}`;
    }
    case "month":
      return formatMonthYear(date);
    case "year":
      return String(yearOf(date));
    case "goals":
      return "Goals";
    case "setup":
      return "Setup";
  }
}

function DateNav({
  tab,
  date,
  today,
  setDate,
}: {
  tab: "day" | "week" | "month" | "year";
  date: string;
  today: string;
  setDate: (d: string) => void;
}) {
  const step = (n: number) => {
    if (tab === "day") return addDays(date, n);
    if (tab === "week") return addDays(date, 7 * n);
    if (tab === "month") return addMonths(date, n);
    return addYears(date, n);
  };
  const unit = { day: "day", week: "week", month: "month", year: "year" }[tab];
  const currentLabel = { day: "Today", week: "This week", month: "This month", year: "This year" }[tab];
  const isCurrent =
    tab === "day"
      ? date === today
      : tab === "week"
        ? startOfWeek(date) === startOfWeek(today)
        : tab === "month"
          ? date.slice(0, 7) === today.slice(0, 7)
          : date.slice(0, 4) === today.slice(0, 4);

  const btn =
    "flex items-center gap-1 rounded-full border border-line bg-card px-3 py-1.5 text-sm font-bold text-ink disabled:opacity-40";
  return (
    <div className="flex items-center justify-between gap-2 px-4 pt-2">
      <button type="button" className={btn} onClick={() => setDate(step(-1))} aria-label={`Previous ${unit}`}>
        {Icons.left} Prev
      </button>
      <button type="button" className={btn} onClick={() => setDate(today)} disabled={isCurrent && date === today}>
        {currentLabel}
      </button>
      <button type="button" className={btn} onClick={() => setDate(step(1))} aria-label={`Next ${unit}`}>
        Next {Icons.right}
      </button>
    </div>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "error") {
    return (
      <button
        type="button"
        onClick={() => void getStore().reload()}
        className="shrink-0 rounded-full bg-high-soft px-3 py-1 text-xs font-bold text-high"
        title="Some changes didn’t save. Tap to reload your data."
      >
        Couldn’t save · Reload
      </button>
    );
  }
  const text = status === "saving" ? "Saving…" : status === "saved" ? "Saved" : "";
  return (
    <span aria-live="polite" className="shrink-0 text-xs font-bold text-muted">
      {text}
    </span>
  );
}
