"use client";

import { useState } from "react";
import { reminderPresets, toLocalInput } from "@/lib/reminders";

/** Quick reminder choices plus an exact date and time. */
export default function ReminderPicker({
  value,
  onChange,
}: {
  value: string | null | undefined;
  onChange: (iso: string | null) => void;
}) {
  const [custom, setCustom] = useState(toLocalInput(value));
  const pill = "rounded-full bg-bg px-3 py-1.5 text-xs font-extrabold";
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-bg/60 p-2">
      <div className="flex flex-wrap gap-1.5">
        {reminderPresets().map((p) => (
          <button key={p.label} type="button" className={pill} onClick={() => onChange(p.iso)}>
            {p.label}
          </button>
        ))}
        {value && (
          <button type="button" className={`${pill} text-high`} onClick={() => onChange(null)}>
            No reminder
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="datetime-local"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          aria-label="Reminder date and time"
          className="min-w-0 flex-1 rounded-xl border border-line bg-card px-2 py-1.5 text-sm"
        />
        <button
          type="button"
          disabled={!custom}
          onClick={() => custom && onChange(new Date(custom).toISOString())}
          className="rounded-full bg-accent px-3 py-1.5 text-xs font-extrabold text-accent-ink disabled:opacity-40"
        >
          Set
        </button>
      </div>
    </div>
  );
}
