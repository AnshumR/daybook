"use client";

import { useEffect, useRef, useState } from "react";

export function Card({
  title,
  action,
  children,
  className = "",
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[22px] bg-card p-4 shadow-[0_2px_0_var(--line)] ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && <h2 className="text-xl font-bold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="rounded-[18px] bg-card px-3 py-3 shadow-[0_2px_0_var(--line)]">
      <div className="text-xs font-bold uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold tabular-nums">{value}</div>
      {sub && <div className="text-xs text-muted">{sub}</div>}
    </div>
  );
}

export function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-heat-0 ${className}`}
      role="progressbar"
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${v}%` }} />
    </div>
  );
}

/** Text that looks like plain text but is editable in place. Commits on blur or Enter. */
export function InlineText({
  value,
  onCommit,
  placeholder,
  className = "",
  ariaLabel,
  strike = false,
  allowEmpty = false,
}: {
  value: string;
  onCommit: (v: string) => void;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
  strike?: boolean;
  allowEmpty?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  const editing = useRef(false);

  useEffect(() => {
    if (!editing.current) setDraft(value);
  }, [value]);

  const commit = () => {
    editing.current = false;
    const next = draft.trim();
    if (!next && !allowEmpty) {
      setDraft(value);
      return;
    }
    if (next !== value) onCommit(next);
  };

  return (
    <input
      value={draft}
      aria-label={ariaLabel}
      placeholder={placeholder}
      onFocus={() => (editing.current = true)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") {
          setDraft(value);
          editing.current = false;
          requestAnimationFrame(() => (e.target as HTMLInputElement).blur());
        }
      }}
      className={`min-w-0 rounded-md bg-transparent px-1 py-0.5 outline-none placeholder:text-muted/70 focus:bg-bg ${
        strike ? "text-muted line-through" : ""
      } ${className}`}
    />
  );
}

/** Ruled notebook textarea. The store debounces saving. */
export function NoteBox({
  value,
  onChange,
  placeholder,
  rows = 4,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  ariaLabel?: string;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      aria-label={ariaLabel}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="ruled block w-full resize-y rounded-lg bg-transparent px-1 outline-none placeholder:text-muted/70"
    />
  );
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-full border px-3 py-1 text-sm font-bold transition-colors ${
        active ? "border-accent bg-accent text-accent-ink" : "border-line bg-card text-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  size = "md",
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-6 w-6" : "h-7 w-7";
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`${dim} grid shrink-0 place-items-center rounded-full border-2 transition-colors ${
        checked ? "border-done bg-done text-card" : "border-line bg-card"
      }`}
    >
      {checked && (
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
          <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

export function IconButton({
  label,
  onClick,
  children,
  disabled,
  className = "",
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-bg hover:text-ink disabled:opacity-30 ${className}`}
    >
      {children}
    </button>
  );
}

export const Icons = {
  trash: (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
      <path d="M4 6h12M8 6V4h4v2m-6 0 1 10h6l1-10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  up: (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
      <path d="M5 12l5-5 5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  down: (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
      <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  left: (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
      <path d="M12 5l-5 5 5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  right: (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
      <path d="M8 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

/** Colour for a category, chosen by its position so it stays stable across renames. */
const TAG_COLOURS = ["#2f7d8c", "#7a5ab5", "#b0527a", "#3d8b4f", "#a2652a", "#4a68b8", "#8a7a1e", "#b24a4a"];
export function tagColour(index: number): string {
  return TAG_COLOURS[((index % TAG_COLOURS.length) + TAG_COLOURS.length) % TAG_COLOURS.length];
}

export const HEAT_CLASS = ["bg-heat-0", "bg-heat-1", "bg-heat-2", "bg-heat-3", "bg-heat-4"];

/** Circular progress with the percentage in the middle. */
export function Ring({ value, size = 60 }: { value: number; size?: number }) {
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Day score ${v}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth="7" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${(v / 100) * c} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-[stroke-dasharray] duration-500"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[15px] font-extrabold tabular-nums">{v}%</span>
    </div>
  );
}
