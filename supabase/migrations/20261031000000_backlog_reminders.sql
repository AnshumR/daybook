-- Daybook update: backlog (tasks without a date) and reminders. Safe to run more than once.

alter table public.tasks alter column date drop not null;
alter table public.tasks add column if not exists remind_at timestamptz;
create index if not exists tasks_user_remind_idx on public.tasks (user_id, remind_at) where remind_at is not null;
