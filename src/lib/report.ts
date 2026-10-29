import { formatLong } from "./dates";
import { describePlanned, formatClock, formatMinutes, plannedAt } from "./insights";
import { dayStats, wordLevel } from "./score";
import { PRIORITY_LABEL, type Day, type Settings, type Task } from "./types";
import { wordForDate } from "./words";

/** Seconds on a task's timer, including a run still going. */
export function timerSeconds(t: Task, now = Date.now()): number {
  const running = t.running_since ? Math.max(0, (now - Date.parse(t.running_since)) / 1000) : 0;
  return (t.elapsed_seconds ?? 0) + running;
}

const clock = (iso?: string | null) => (iso ? formatClock(new Date(iso)) : "");

/** Plain-text summary of a day, ready to paste into a chat. */
export function dayReport(settings: Settings, day: Day | undefined, tasks: Task[], date: string): string {
  const s = dayStats(settings, day, tasks, date);
  const done = new Set(day?.habits_done ?? []);
  const catName = (id: string | null) => settings.categories.find((c) => c.id === id)?.name;
  const lines: string[] = [];

  lines.push(`Daybook: ${formatLong(date)}`);
  const parts = [`habits ${s.habitsDone}/${s.habitsTotal}`, `tasks ${s.tasksDone}/${s.tasksTotal}`];
  if (s.dontsTotal) parts.push(`avoided ${s.dontsKept}/${s.dontsTotal}`);
  if (s.wordCounts) parts.push(`word ${s.wordDone ? "done" : "not done"}`);
  lines.push(`Day score ${s.score}% (${parts.join(", ")})`);
  const time = [describePlanned(plannedAt(tasks, date))];
  const tracked = tasks.reduce((n, t) => n + timerSeconds(t), 0);
  if (tracked >= 60) time.push(`${formatMinutes(tracked / 60)} tracked on tasks`);
  if (day?.app_seconds) time.push(`${formatMinutes(day.app_seconds / 60)} in Daybook`);
  if (day?.screen_minutes != null) time.push(`phone screen time ${formatMinutes(day.screen_minutes)}`);
  lines.push(time.join(" · "));

  // Tasks grouped by category, in the order they were arranged.
  lines.push("", "TASKS");
  if (tasks.length === 0) lines.push("No tasks planned.");
  const groups = new Map<string, Task[]>();
  for (const t of [...tasks].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))) {
    const key = catName(t.category_id) ?? "Other";
    groups.set(key, [...(groups.get(key) ?? []), t]);
  }
  for (const [cat, list] of groups) {
    const secs = list.reduce((n, t) => n + timerSeconds(t), 0);
    lines.push(`${cat}${secs >= 60 ? ` (${formatMinutes(secs / 60)})` : ""}`);
    for (const t of list) {
      const info: string[] = [];
      if (t.started_at) info.push(`started ${clock(t.started_at)}`);
      if (t.done && t.done_at) info.push(`finished ${clock(t.done_at)}`);
      const secsT = timerSeconds(t);
      if (secsT >= 60) info.push(formatMinutes(secsT / 60));
      if (t.running_since) info.push("still running");
      if (t.moved_count) info.push(`moved ${t.moved_count}×`);
      lines.push(`  ${t.done ? "✓" : "✗"} [${PRIORITY_LABEL[t.priority]}] ${t.text}${info.length ? ` · ${info.join(", ")}` : ""}`);
    }
  }

  lines.push("", "HABITS");
  for (const h of settings.habits) {
    const at = day?.habit_times?.[h.id];
    lines.push(`  ${done.has(h.id) ? "✓" : "✗"} ${h.name}${done.has(h.id) && at ? ` · ${clock(at)}` : ""}`);
  }

  if (s.dontsTotal) {
    lines.push("", "DON'T LIST");
    for (const x of settings.donts) {
      const r = day?.donts?.[x.id];
      lines.push(`  ${r === "kept" ? "✓ Avoided" : r === "slipped" ? "✗ Slipped" : "– Not marked"}: ${x.name}`);
    }
  }

  if (s.wordCounts) {
    const w = wordForDate(date, wordLevel(settings));
    lines.push("", `WORD OF THE DAY: ${w.word} (${w.hindi})`);
    lines.push(day?.word_sentence?.trim() ? `My sentence: "${day.word_sentence.trim()}"` : "No sentence written.");
  }

  const reflect: [string, string | undefined][] = [
    ["What went well", day?.went_well],
    ["What to improve", day?.improve],
    ["Notes", day?.note],
  ];
  const filled = reflect.filter(([, v]) => v?.trim());
  if (filled.length) {
    lines.push("", "REFLECTION");
    for (const [label, v] of filled) lines.push(`${label}: ${v!.trim()}`);
  }
  return lines.join("\n");
}
