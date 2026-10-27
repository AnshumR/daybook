-- Daybook update: word of the day sentences and per-user preferences (theme, focus, etc.)
-- Safe to run more than once.

alter table public.days
  add column if not exists word_sentence text not null default '';

alter table public.settings
  add column if not exists prefs jsonb not null default '{}'::jsonb;
