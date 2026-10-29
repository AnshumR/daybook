"use client";

import { useEffect, useMemo, useState } from "react";
import { getStore, useData } from "@/lib/store";
import { todayISO } from "@/lib/dates";
import { PRIORITIES, PRIORITY_LABEL, PRIORITY_NAME, PRIORITY_RANK, type Priority, type Task } from "@/lib/types";
import type { Navigate } from "./App";
import { Card, IconButton, InlineText, tagColour } from "./ui";

export default function BacklogTab({ navigate }: { navigate: Navigate }) {
  const data = useData();
  const store = getStore();
  const { categories } = data.settings;
  const [filter, setFilter] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  const backlog = data.tasks.filter((t) => t.date === null && !t.done);
  const items = useMemo(() => {
    const list = filter ? backlog.filter((t) => t.category_id === filter) : backlog;
    return [...list].sort(
      (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.created_at.localeCompare(b.created_at),
    );
  }, [backlog, filter]);

  const addCategory = filter ?? (category || categories[0]?.id || null);
  const catIndex = (id: string | null) => categories.findIndex((c) => c.id === id);

  function add(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    // Backlog tasks never get a date or reminder; picking for Today gives them a day.
    store.addBacklogTask(t, addCategory, priority, null);
    setText("");
  }

  function pick(t: Task, date: string) {
    store.pickForDay(t.id, date);
    setPicked(t.text);
    setTimeout(() => setPicked((p) => (p === t.text ? null : p)), 2500);
  }

  const cycle = <T,>(list: T[], current: T) => list[(list.indexOf(current) + 1) % list.length];
  const pill = "rounded-full bg-bg px-3 py-1.5 text-xs font-extrabold";

  return (
    <>
      <p className="-mt-1 px-1 text-sm text-muted">Everything you might do, with no dates. Tap Today when you want to do it.</p>

      <Card>
        <form onSubmit={add} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add to backlog…"
              aria-label="New backlog task"
              className="min-w-0 flex-1 rounded-2xl border-[1.5px] border-dashed border-line bg-bg px-3 py-2.5 outline-none placeholder:text-muted focus:border-solid focus:border-accent"
            />
            <button type="submit" className="shrink-0 rounded-2xl bg-accent px-4 py-2 font-extrabold text-accent-ink">
              Add
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
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
            {!filter && categories.length > 0 && (
              <select
                value={addCategory ?? ""}
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
          </div>
        </form>
      </Card>

      {picked && (
        <button type="button" onClick={() => navigate("day", todayISO())} className="rounded-[22px] bg-done-soft px-4 py-3 text-left font-bold text-done">
          “{picked}” added. Open Today →
        </button>
      )}

      <Card>
        {categories.length > 0 && (
          <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4" role="tablist" aria-label="Backlog category">
            {[{ id: null as string | null, name: "All" }, ...categories].map((c) => {
              const active = c.id === filter;
              const n = backlog.filter((t) => c.id === null || t.category_id === c.id).length;
              return (
                <button
                  key={c.id ?? "all"}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(c.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-extrabold ${active ? "bg-ink text-bg" : "bg-bg text-muted"}`}
                >
                  {c.name}
                  {n > 0 && <span className={`text-xs ${active ? "opacity-75" : ""}`}>{n}</span>}
                </button>
              );
            })}
          </div>
        )}

        <ul className="flex flex-col">
          {items.length === 0 && <li className="py-3 text-muted">Nothing here. Add ideas and to-dos above whenever they come to you.</li>}
          {items.map((t) => {
            const ci = catIndex(t.category_id);
            const cat = ci >= 0 ? categories[ci] : null;
            return (
              <li key={t.id} className="border-b border-line py-2 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <InlineText value={t.text} onCommit={(v) => store.updateTask(t.id, { text: v })} ariaLabel="Backlog task" className="w-full text-[16px] font-semibold" />
                    <div className="flex flex-wrap items-center gap-x-2 px-1 text-xs text-muted">
                      <span className={`rounded-full px-1.5 font-extrabold ${priorityClass(t.priority)}`}>{PRIORITY_LABEL[t.priority]}</span>
                      {!filter && cat && (
                        <span className="flex items-center gap-1 font-bold">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: tagColour(ci) }} />
                          {cat.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <button type="button" onClick={() => pick(t, todayISO())} className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-xs font-extrabold text-accent-ink" aria-label={`Pick ${t.text} for today`}>
                    Today
                  </button>
                  <IconButton label={`More for ${t.text}`} onClick={() => setOpenRow((r) => (r === t.id ? null : t.id))} className="h-8 w-8">
                    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
                      <circle cx="4" cy="10" r="1.6" fill="currentColor" />
                      <circle cx="10" cy="10" r="1.6" fill="currentColor" />
                      <circle cx="16" cy="10" r="1.6" fill="currentColor" />
                    </svg>
                  </IconButton>
                </div>
                {openRow === t.id && (
                  <div className="mt-2 flex flex-col gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      <button type="button" className={pill} onClick={() => store.updateTask(t.id, { priority: cycle(PRIORITIES, t.priority) })}>
                        Priority: {PRIORITY_LABEL[t.priority]}
                      </button>
                      {categories.length > 0 && (
                        <button type="button" className={pill} onClick={() => store.updateTask(t.id, { category_id: cycle(categories, cat ?? categories[categories.length - 1]).id })}>
                          Category: {cat?.name ?? "None"}
                        </button>
                      )}
                      <button
                        type="button"
                        className={pill}
                        onClick={() => {
                          store.pickForDay(t.id, todayISO());
                          store.setTaskDone(t.id, true);
                        }}
                      >
                        Already done
                      </button>
                      <button type="button" className={`${pill} text-high`} onClick={() => store.deleteTask(t.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Card>
    </>
  );
}

function priorityClass(p: Priority) {
  return p === "high" ? "bg-accent text-accent-ink" : p === "medium" ? "bg-medium-soft text-medium" : "bg-low-soft text-low";
}

/** Current time, refreshed every minute (for due reminders). */
export function useMinute(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}
