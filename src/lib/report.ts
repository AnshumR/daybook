import { formatLong } from "./dates";
import { describePlanned, formatMinutes, plannedAt } from "./insights";
import { dayStats } from "./score";
import { PRIORITY_LABEL, PRIORITY_RANK, type Day, type Settings, type Task } from "./types";
import { wordForDate } from "./words";

/** Plain-text summary of a day, ready to paste into a chat. */
export function dayReport(settings: Settings, day: Day | undefined, tasks: Task[], date: string): string {
  const s = dayStats(settings, day, tasks, date);
  const done = new Set(day?.habits_done ?? []);
  const catName = (id: string | null) => settings.categories.find((c) => c.id === id)?.name;
  const lines: string[] = [];

  lines.push(`Daybook: ${formatLong(date)}`);
  lines.push(
    `Day score ${s.score}% (habits ${s.habitsDone}/${s.habitsTotal}, tasks ${s.tasksDone}/${s.tasksTotal}${
      s.wordCounts ? `, word ${s.wordDone ? "done" : "not done"}` : ""
    })`,
  );
  const time = [describePlanned(plannedAt(tasks, date))];
  if (day?.app_seconds) time.push(`${formatMinutes(day.app_seconds / 60)} in Daybook`);
  if (day?.screen_minutes != null) time.push(`phone screen time ${formatMinutes(day.screen_minutes)}`);
  lines.push(time.join(" · "));

  const habitsDone = settings.habits.filter((h) => done.has(h.id)).map((h) => h.name);
  const habitsMissed = settings.habits.filter((h) => !done.has(h.id)).map((h) => h.name);
  lines.push("", "HABITS");
  lines.push(`✓ Done: ${habitsDone.length ? habitsDone.join(", ") : "none"}`);
  if (habitsMissed.length) lines.push(`✗ Missed: ${habitsMissed.join(", ")}`);

  lines.push("", "TASKS");
  if (tasks.length === 0) lines.push("No tasks planned.");
  const sorted = [...tasks].sort(
    (a, b) => Number(b.done) - Number(a.done) || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
  );
  for (const t of sorted) {
    const extra = [catName(t.category_id), t.moved_count ? `moved ${t.moved_count}×` : ""].filter(Boolean).join(", ");
    lines.push(`${t.done ? "✓" : "✗"} [${PRIORITY_LABEL[t.priority]}] ${t.text}${extra ? ` (${extra})` : ""}`);
  }

  if (s.wordCounts) {
    const w = wordForDate(date);
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
