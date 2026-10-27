"use client";

import { useState } from "react";
import { getStore, useData } from "@/lib/store";
import { downloadCSV } from "@/lib/csv";
import { todayISO } from "@/lib/dates";
import { shortId } from "@/lib/ids";
import { dayStats } from "@/lib/score";
import { PRIORITY_LABEL, TIMEFRAME_LABEL, type Item, type Settings, type Task } from "@/lib/types";
import { Card, IconButton, Icons, InlineText } from "./ui";

export default function SetupTab() {
  const data = useData();
  return (
    <>
      <ListEditor
        title="Habits"
        hint="Your daily routine. Renaming keeps all past ticks."
        field="habits"
        prefix="h"
        placeholder="New habit"
        items={data.settings.habits}
        removeWarning="Remove this habit? It will disappear from your routine and stats (past ticks are kept in your data but no longer counted)."
      />
      <ListEditor
        title="Categories"
        hint="Used to tag tasks. Renaming updates every task."
        field="categories"
        prefix="c"
        placeholder="New category"
        items={data.settings.categories}
        removeWarning="Remove this category? Tasks using it will show as “No category”."
      />
      <ListEditor
        title="Goal areas"
        hint="Used to group goals."
        field="areas"
        prefix="a"
        placeholder="New area"
        items={data.settings.areas}
        removeWarning="Remove this area? Goals using it will have no area."
      />
      <ExportCard />
      <AccountCard />
    </>
  );
}

function ListEditor({
  title,
  hint,
  field,
  prefix,
  placeholder,
  items,
  removeWarning,
}: {
  title: string;
  hint: string;
  field: keyof Settings;
  prefix: string;
  placeholder: string;
  items: Item[];
  removeWarning: string;
}) {
  const store = getStore();
  const [name, setName] = useState("");
  const save = (next: Item[]) => store.updateSettings({ [field]: next });

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    save(next);
  };

  function add(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    save([...items, { id: shortId(prefix), name: n }]);
    setName("");
  }

  return (
    <Card title={title}>
      <p className="-mt-2 mb-3 text-sm text-muted">{hint}</p>
      <ul className="flex flex-col">
        {items.map((item, i) => (
          <li key={item.id} className="flex items-center gap-1 border-b border-line py-1.5 last:border-0">
            <InlineText
              value={item.name}
              onCommit={(v) => save(items.map((x) => (x.id === item.id ? { ...x, name: v } : x)))}
              ariaLabel={`Rename ${item.name}`}
              className="flex-1"
            />
            <IconButton label="Move up" onClick={() => move(i, -1)} disabled={i === 0}>
              {Icons.up}
            </IconButton>
            <IconButton label="Move down" onClick={() => move(i, 1)} disabled={i === items.length - 1}>
              {Icons.down}
            </IconButton>
            <IconButton
              label={`Remove ${item.name}`}
              onClick={() => {
                if (confirm(removeWarning)) save(items.filter((x) => x.id !== item.id));
              }}
              className="hover:text-high"
            >
              {Icons.trash}
            </IconButton>
          </li>
        ))}
        {items.length === 0 && <li className="py-2 text-muted">None yet.</li>}
      </ul>
      <form onSubmit={add} className="mt-3 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 py-2 outline-none focus:border-accent"
        />
        <button type="submit" className="shrink-0 rounded-xl bg-accent px-4 py-2 font-bold text-accent-ink">
          Add
        </button>
      </form>
    </Card>
  );
}

function ExportCard() {
  const data = useData();
  const stamp = todayISO();
  const { settings } = data;
  const catName = (id: string | null) => settings.categories.find((c) => c.id === id)?.name ?? "";
  const areaName = (id: string | null) => settings.areas.find((a) => a.id === id)?.name ?? "";

  function exportDaily() {
    const tasksByDate = new Map<string, Task[]>();
    for (const t of data.tasks) tasksByDate.set(t.date, [...(tasksByDate.get(t.date) ?? []), t]);
    const dates = Array.from(new Set([...Object.keys(data.days), ...tasksByDate.keys()])).sort();
    const rows: (string | number)[][] = [
      ["Date", ...settings.habits.map((h) => h.name), "Habits done", "Habits total", "Tasks done", "Tasks total", "Day score %", "Note"],
    ];
    for (const d of dates) {
      const day = data.days[d];
      const s = dayStats(settings, day, tasksByDate.get(d) ?? []);
      if (!s.logged) continue;
      rows.push([
        d,
        ...settings.habits.map((h) => (day?.habits_done?.includes(h.id) ? 1 : 0)),
        s.habitsDone,
        s.habitsTotal,
        s.tasksDone,
        s.tasksTotal,
        s.score,
        day?.note ?? "",
      ]);
    }
    downloadCSV(`daybook-daily-log-${stamp}.csv`, rows);
  }

  function exportTasks() {
    const rows: (string | number)[][] = [["Date", "Task", "Category", "Priority", "Done", "Times moved", "Created"]];
    [...data.tasks]
      .sort((a, b) => a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at))
      .forEach((t) =>
        rows.push([t.date, t.text, catName(t.category_id), PRIORITY_LABEL[t.priority], t.done ? "Yes" : "No", t.moved_count, t.created_at]),
      );
    downloadCSV(`daybook-tasks-${stamp}.csv`, rows);
  }

  function exportGoals() {
    const rows: (string | number)[][] = [["Title", "Area", "Timeframe", "Target date", "Progress %", "Next step", "Done", "Created"]];
    data.goals.forEach((g) =>
      rows.push([
        g.title,
        areaName(g.area_id),
        TIMEFRAME_LABEL[g.timeframe],
        g.target_date ?? "",
        g.progress,
        g.next_step,
        g.done ? "Yes" : "No",
        g.created_at,
      ]),
    );
    downloadCSV(`daybook-goals-${stamp}.csv`, rows);
  }

  const btn = "rounded-xl border border-line bg-bg px-4 py-2.5 text-left font-bold hover:border-accent";
  return (
    <Card title="Export">
      <p className="-mt-2 mb-3 text-sm text-muted">
        CSV files you can open in Excel or import into Google Sheets (File → Import → Upload).
      </p>
      <div className="flex flex-col gap-2">
        <button type="button" onClick={exportDaily} className={btn}>
          Daily log (CSV)
        </button>
        <button type="button" onClick={exportTasks} className={btn}>
          All tasks (CSV)
        </button>
        <button type="button" onClick={exportGoals} className={btn}>
          Goals (CSV)
        </button>
      </div>
    </Card>
  );
}

function AccountCard() {
  const data = useData();
  const store = getStore();
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function del() {
    setBusy(true);
    setError(null);
    const err = await store.deleteAccount();
    if (err) {
      setError(err);
      setBusy(false);
    }
  }

  return (
    <Card title="Account">
      <p className="text-sm text-muted">
        Signed in as <strong className="text-ink">{data.email || "you"}</strong>
      </p>
      <button
        type="button"
        onClick={() => void store.signOut()}
        className="mt-3 rounded-xl border border-line bg-bg px-4 py-2.5 font-bold"
      >
        Sign out
      </button>

      <div className="mt-5 border-t border-line pt-4">
        {!confirming ? (
          <button type="button" onClick={() => setConfirming(true)} className="font-bold text-high">
            Delete my account and data
          </button>
        ) : (
          <div className="rounded-xl border border-high/40 bg-high-soft p-3">
            <p className="font-bold text-high">This permanently deletes your account and everything in it.</p>
            <p className="mt-1 text-sm">Export anything you want to keep first. Type DELETE to confirm.</p>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              aria-label="Type DELETE to confirm"
              className="mt-2 w-full rounded-lg border border-line bg-card px-3 py-2 outline-none focus:border-high"
            />
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={typed !== "DELETE" || busy}
                onClick={() => void del()}
                className="rounded-lg bg-high px-4 py-2 font-bold text-white disabled:opacity-40"
              >
                {busy ? "Deleting…" : "Delete everything"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirming(false);
                  setTyped("");
                }}
                className="rounded-lg px-4 py-2 font-bold text-muted"
              >
                Cancel
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-high">Couldn’t delete: {error}</p>}
          </div>
        )}
      </div>
    </Card>
  );
}
