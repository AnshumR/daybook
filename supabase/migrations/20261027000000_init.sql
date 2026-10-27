-- Daybook: initial schema
-- Every table is keyed by user_id and protected by Row Level Security so that
-- each signed-in user can only ever read and write their own rows.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- settings: one row per user. Habits, categories and goal areas are stored as
-- ordered jsonb arrays of {"id": "...", "name": "..."} so that renaming keeps
-- history (logs and tasks reference the id, never the name).
-- ---------------------------------------------------------------------------

create table public.settings (
  user_id     uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  habits      jsonb not null default '[]'::jsonb,
  categories  jsonb not null default '[]'::jsonb,
  areas       jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- days: one row per user per date. habits_done is a jsonb array of habit ids.
-- ---------------------------------------------------------------------------

create table public.days (
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date         date not null,
  habits_done  jsonb not null default '[]'::jsonb,
  note         text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (user_id, date)
);

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------

create table public.tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date         date not null,
  text         text not null default '',
  category_id  text,
  priority     text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  done         boolean not null default false,
  moved_count  integer not null default 0 check (moved_count >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index tasks_user_date_idx on public.tasks (user_id, date);

-- ---------------------------------------------------------------------------
-- goals
-- ---------------------------------------------------------------------------

create table public.goals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title        text not null default '',
  area_id      text,
  timeframe    text not null default 'month' check (timeframe in ('month', 'year', 'long')),
  target_date  date,
  progress     integer not null default 0 check (progress between 0 and 100),
  next_step    text not null default '',
  done         boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index goals_user_idx on public.goals (user_id);
create index goals_user_target_idx on public.goals (user_id, target_date);

-- ---------------------------------------------------------------------------
-- month_notes / year_notes
-- ---------------------------------------------------------------------------

create table public.month_notes (
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  month       text not null check (month ~ '^[0-9]{4}-[0-9]{2}$'),
  focus       text not null default '',
  review      text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (user_id, month)
);

create table public.year_notes (
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  year        integer not null check (year between 1900 and 3000),
  theme       text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (user_id, year)
);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create trigger settings_updated_at    before update on public.settings    for each row execute function public.set_updated_at();
create trigger days_updated_at        before update on public.days        for each row execute function public.set_updated_at();
create trigger tasks_updated_at       before update on public.tasks       for each row execute function public.set_updated_at();
create trigger goals_updated_at       before update on public.goals       for each row execute function public.set_updated_at();
create trigger month_notes_updated_at before update on public.month_notes for each row execute function public.set_updated_at();
create trigger year_notes_updated_at  before update on public.year_notes  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: user_id = auth.uid() for select / insert / update / delete
-- ---------------------------------------------------------------------------

alter table public.settings    enable row level security;
alter table public.days        enable row level security;
alter table public.tasks       enable row level security;
alter table public.goals       enable row level security;
alter table public.month_notes enable row level security;
alter table public.year_notes  enable row level security;

-- settings
create policy "settings_select_own" on public.settings for select to authenticated using (user_id = (select auth.uid()));
create policy "settings_insert_own" on public.settings for insert to authenticated with check (user_id = (select auth.uid()));
create policy "settings_update_own" on public.settings for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "settings_delete_own" on public.settings for delete to authenticated using (user_id = (select auth.uid()));

-- days
create policy "days_select_own" on public.days for select to authenticated using (user_id = (select auth.uid()));
create policy "days_insert_own" on public.days for insert to authenticated with check (user_id = (select auth.uid()));
create policy "days_update_own" on public.days for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "days_delete_own" on public.days for delete to authenticated using (user_id = (select auth.uid()));

-- tasks
create policy "tasks_select_own" on public.tasks for select to authenticated using (user_id = (select auth.uid()));
create policy "tasks_insert_own" on public.tasks for insert to authenticated with check (user_id = (select auth.uid()));
create policy "tasks_update_own" on public.tasks for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "tasks_delete_own" on public.tasks for delete to authenticated using (user_id = (select auth.uid()));

-- goals
create policy "goals_select_own" on public.goals for select to authenticated using (user_id = (select auth.uid()));
create policy "goals_insert_own" on public.goals for insert to authenticated with check (user_id = (select auth.uid()));
create policy "goals_update_own" on public.goals for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "goals_delete_own" on public.goals for delete to authenticated using (user_id = (select auth.uid()));

-- month_notes
create policy "month_notes_select_own" on public.month_notes for select to authenticated using (user_id = (select auth.uid()));
create policy "month_notes_insert_own" on public.month_notes for insert to authenticated with check (user_id = (select auth.uid()));
create policy "month_notes_update_own" on public.month_notes for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "month_notes_delete_own" on public.month_notes for delete to authenticated using (user_id = (select auth.uid()));

-- year_notes
create policy "year_notes_select_own" on public.year_notes for select to authenticated using (user_id = (select auth.uid()));
create policy "year_notes_insert_own" on public.year_notes for insert to authenticated with check (user_id = (select auth.uid()));
create policy "year_notes_update_own" on public.year_notes for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "year_notes_delete_own" on public.year_notes for delete to authenticated using (user_id = (select auth.uid()));

-- Only signed-in users may touch these tables at all.
revoke all on public.settings, public.days, public.tasks, public.goals, public.month_notes, public.year_notes from anon;
grant select, insert, update, delete on public.settings, public.days, public.tasks, public.goals, public.month_notes, public.year_notes to authenticated;

-- ---------------------------------------------------------------------------
-- Delete my account: removes the auth user, which cascades to every table above.
-- security definer so a user can delete *only themselves* without a service key.
-- ---------------------------------------------------------------------------

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;

  delete from public.tasks       where user_id = uid;
  delete from public.goals       where user_id = uid;
  delete from public.days        where user_id = uid;
  delete from public.month_notes where user_id = uid;
  delete from public.year_notes  where user_id = uid;
  delete from public.settings    where user_id = uid;
  delete from auth.users         where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
