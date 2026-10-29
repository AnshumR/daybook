-- Daybook update: task timers and order, every-day tasks, don't list, tick times.
-- Safe to run more than once.

-- Tasks: manual order, timer, finish time, link to an every-day template.
alter table public.tasks add column if not exists position double precision;
alter table public.tasks add column if not exists recurring_id text;
alter table public.tasks add column if not exists done_at timestamptz;
alter table public.tasks add column if not exists started_at timestamptz;
alter table public.tasks add column if not exists running_since timestamptz;
alter table public.tasks add column if not exists elapsed_seconds integer not null default 0;

-- Days: when each habit was ticked, don't-list results, every-day tasks added.
alter table public.days add column if not exists habit_times jsonb not null default '{}'::jsonb;
alter table public.days add column if not exists donts jsonb not null default '{}'::jsonb;
alter table public.days add column if not exists recurring_added boolean not null default false;

-- Settings: every-day task templates and the don't list.
alter table public.settings add column if not exists recurring jsonb not null default '[]'::jsonb;
alter table public.settings add column if not exists donts jsonb not null default '[]'::jsonb;
