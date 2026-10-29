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
import Background from "./Background";

export type Tab = "day" | "week" | "month" | "year" | "goals" | "setup";
const TABS: { id: Tab; label: string }[] = [
  { id: "day", label: "Today" },
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
  const dated = tab === "day" || tab === "week" || tab === "month" || tab === "year";

  return (
    <div className="mx-auto min-h-dvh max-w-[680px]">
      <Background />
      <header className="sticky top-0 z-20 bg-bg/90 pt-safe backdrop-blur">
        <div className="flex min-h-14 items-center gap-2 px-3">
          {dated ? (
            <DateNav tab={tab} date={date} today={today} setDate={setDate} />
          ) : (
            <h1 className="flex-1 px-1 text-2xl font-bold">{tab === "goals" ? "Goals" : "Setup"}</h1>
          )}
          <SaveIndicator status={state.status} />
        </div>
      </header>

      <main className="flex flex-col gap-4 px-4 pb-32 pt-2">
        {tab === "day" && <DayTab date={date} />}
        {tab === "week" && <WeekTab date={date} navigate={navigate} />}
        {tab === "month" && <MonthTab date={date} navigate={navigate} />}
        {tab === "year" && <YearTab date={date} navigate={navigate} />}
        {tab === "goals" && <GoalsTab navigate={navigate} />}
        {tab === "setup" && <SetupTab />}
      </main>

      <nav
        aria-label="Sections"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-card/95 pb-safe backdrop-blur"
      >
        <div className="mx-auto grid max-w-[680px] grid-cols-6 px-1">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => navigate(t.id, t.id === "day" && tab === "day" ? today : undefined)}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-extrabold ${
                  active ? "text-accent" : "text-muted"
                }`}
              >
                {TAB_ICONS[t.id]}
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

const iconProps = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
const TAB_ICONS: Record<Tab, React.ReactNode> = {
  day: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
    </svg>
  ),
  week: (
    <svg {...iconProps}>
      <rect x="3.5" y="5" width="17" height="15" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  ),
  month: (
    <svg {...iconProps}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <path d="M8 9h.01M12 9h.01M16 9h.01M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01" strokeWidth="2.6" />
    </svg>
  ),
  year: (
    <svg {...iconProps}>
      <path d="M4 20V10M10 20V4M16 20v-7M21 20H3" />
    </svg>
  ),
  goals: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" />
    </svg>
  ),
  setup: (
    <svg {...iconProps}>
      <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
      <circle cx="16" cy="7" r="2.2" />
      <circle cx="8" cy="17" r="2.2" />
    </svg>
  ),
};

function headerTitle(tab: "day" | "week" | "month" | "year", date: string): string {
  switch (tab) {
    case "day": {
      // Drop the year when it's this year, so the date fits on a phone.
      const long = formatLong(date);
      return date.slice(0, 4) === todayISO().slice(0, 4) ? long.replace(/ \d{4}$/, "") : long;
    }
    case "week": {
      const start = startOfWeek(date);
      return `${formatShort(start)} – ${formatShort(addDays(start, 6))}`;
    }
    case "month":
      return formatMonthYear(date);
    case "year":
      return String(yearOf(date));
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
  const unit = tab;
  const currentLabel = { day: "Back to today", week: "Back to this week", month: "Back to this month", year: "Back to this year" }[tab];
  const isCurrent =
    tab === "day"
      ? date === today
      : tab === "week"
        ? startOfWeek(date) === startOfWeek(today)
        : tab === "month"
          ? date.slice(0, 7) === today.slice(0, 7)
          : date.slice(0, 4) === today.slice(0, 4);

  const arrow = "grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink hover:bg-card";
  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      <button type="button" className={arrow} onClick={() => setDate(step(-1))} aria-label={`Previous ${unit}`}>
        {Icons.left}
      </button>
      <div className="min-w-0 flex-1 text-center">
        <p className="truncate font-display text-lg font-bold">{headerTitle(tab, date)}</p>
        {!isCurrent && (
          <button type="button" onClick={() => setDate(today)} className="text-xs font-extrabold text-accent">
            {currentLabel}
          </button>
        )}
      </div>
      <button type="button" className={arrow} onClick={() => setDate(step(1))} aria-label={`Next ${unit}`}>
        {Icons.right}
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
