"use client";

import { useEffect, useState } from "react";
import { getStore, useData } from "@/lib/store";
import { downloadCSV } from "@/lib/csv";
import { todayISO } from "@/lib/dates";
import { shortId } from "@/lib/ids";
import { dayStats, wordEnabled } from "@/lib/score";
import { DEFAULT_MODE, DEFAULT_THEME, isMode, isThemeId, THEME_IDS, THEMES, type Mode } from "@/lib/themes";
import { wordForDate } from "@/lib/words";
import { PRIORITY_LABEL, TIMEFRAME_LABEL, type Item, type Task } from "@/lib/types";
import { Card, IconButton, Icons, InlineText } from "./ui";

export default function SetupTab() {
  const data = useData();
  return (
    <>
      <AppearanceCard />
      <FeaturesCard />
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
  field: "habits" | "categories" | "areas";
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
      ["Date", ...settings.habits.map((h) => h.name), "Habits done", "Habits total", "Tasks done", "Tasks total", "Day score %", "Word", "Word sentence", "Note"],
    ];
    for (const d of dates) {
      const day = data.days[d];
      const s = dayStats(settings, day, tasksByDate.get(d) ?? [], d);
      if (!s.logged) continue;
      rows.push([
        d,
        ...settings.habits.map((h) => (day?.habits_done?.includes(h.id) ? 1 : 0)),
        s.habitsDone,
        s.habitsTotal,
        s.tasksDone,
        s.tasksTotal,
        s.score,
        s.wordCounts ? wordForDate(d).word : "",
        day?.word_sentence ?? "",
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

function AppearanceCard() {
  const data = useData();
  const store = getStore();
  const prefs = data.settings.prefs ?? {};
  const theme = isThemeId(prefs.theme) ? prefs.theme : DEFAULT_THEME;
  const mode = isMode(prefs.mode) ? prefs.mode : DEFAULT_MODE;
  const modes: { id: Mode; label: string }[] = [
    { id: "system", label: "Auto" },
    { id: "light", label: "Light" },
    { id: "dark", label: "Dark" },
  ];

  return (
    <Card title="Appearance">
      <p className="-mt-2 mb-3 text-sm text-muted">Pick your colours. Saved to your account on every device.</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {THEME_IDS.map((id) => {
          const t = THEMES[id];
          const active = id === theme;
          return (
            <button
              key={id}
              type="button"
              onClick={() => store.updatePrefs({ theme: id })}
              aria-pressed={active}
              className={`flex items-center gap-2 rounded-xl border-2 p-2 text-left text-sm font-bold ${
                active ? "border-accent" : "border-line"
              }`}
            >
              <span className="flex shrink-0 overflow-hidden rounded-lg border border-line" aria-hidden="true">
                <span className="h-7 w-4" style={{ background: t.light.bg }} />
                <span className="h-7 w-4" style={{ background: t.light.accent }} />
                <span className="h-7 w-4" style={{ background: t.dark.bg }} />
              </span>
              {t.name}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <span className="text-sm font-bold text-muted">Mode</span>
        <div className="flex overflow-hidden rounded-full border border-line">
          {modes.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => store.updatePrefs({ mode: m.id })}
              aria-pressed={mode === m.id}
              className={`px-3.5 py-1.5 text-sm font-bold ${mode === m.id ? "bg-accent text-accent-ink" : "text-muted"}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}

function FeaturesCard() {
  const data = useData();
  const store = getStore();
  const wordOn = wordEnabled(data.settings);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    setPermission("Notification" in window ? Notification.permission : "unsupported");
  }, []);

  async function enable() {
    if (!("Notification" in window)) return;
    setPermission(await Notification.requestPermission());
  }

  return (
    <Card title="Features">
      <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
        <div>
          <p className="font-bold">Word of the day</p>
          <p className="text-sm text-muted">An English word with its Hindi meaning. Write a sentence to tick it off.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={wordOn}
          aria-label="Word of the day"
          onClick={() => store.updatePrefs({ wordOfDay: !wordOn })}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${wordOn ? "bg-accent" : "bg-line"}`}
        >
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-card shadow transition-all ${wordOn ? "left-6" : "left-1"}`} />
        </button>
      </div>
      <div className="pt-3">
        <p className="font-bold">Reminders</p>
        <p className="text-sm text-muted">
          A nudge when a P1 task, or a task in your focus category, has waited 2 hours. Works while Daybook is open.
        </p>
        {permission === "granted" ? (
          <p className="mt-2 text-sm font-bold text-accent">✓ Notifications are on</p>
        ) : permission === "denied" ? (
          <p className="mt-2 text-sm text-muted">Notifications are blocked. Allow them for this site in your browser settings.</p>
        ) : permission === "unsupported" ? (
          <p className="mt-2 text-sm text-muted">This browser can’t show notifications. You’ll still see the reminder banner.</p>
        ) : (
          <button type="button" onClick={() => void enable()} className="mt-2 rounded-xl bg-accent px-4 py-2 text-sm font-bold text-accent-ink">
            Turn on notifications
          </button>
        )}
      </div>
    </Card>
  );
}
