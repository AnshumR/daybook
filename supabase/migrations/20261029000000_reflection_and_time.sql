-- Daybook update: end-of-day reflection and time tracking. Safe to run more than once.

alter table public.days add column if not exists went_well text not null default '';
alter table public.days add column if not exists improve text not null default '';
-- Seconds Daybook was open and visible on this date.
alter table public.days add column if not exists app_seconds integer not null default 0 check (app_seconds >= 0);
-- Phone screen time the user types in (minutes), from iPhone/Android settings.
alter table public.days add column if not exists screen_minutes integer check (screen_minutes between 0 and 1440);
