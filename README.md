# Daybook

A personal daily planner and life tracker. Plan the day, tick off your routine, carry over unfinished tasks, and see your week, month and year at a glance. Anyone can sign up; every user only ever sees their own data.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · Supabase (Auth + Postgres with Row Level Security) · Vercel · installable PWA.

## Features

- **Day**: routine x/y, tasks x/y and a day score. Habit checkboxes with streaks. Tasks with category and priority that sort themselves, can be edited inline, and can be filtered by category. A banner to carry over yesterday's unfinished tasks (shows "moved 2×"). Notes that save automatically.
- **Week**: a 7-day habit grid you can tap, day scores and tasks done, plus 30-day consistency bars.
- **Month**: a heatmap calendar, average score, full days, tasks done, habit percentages, and Focus and Review notes.
- **Year**: 12 mini heatmaps, yearly stats, theme and intentions, and goals due this year.
- **Goals**: area, timeframe, target date, days left or overdue, progress in ±10% steps, and a next step with "Plan it today".
- **Setup**: add, rename, reorder and remove habits, categories and goal areas. Renames keep history because everything is stored by id. CSV exports and account deletion.

## Setup

You need free accounts on [Supabase](https://supabase.com), [Google Cloud](https://console.cloud.google.com) and [Vercel](https://vercel.com).

### 1. Create a Supabase project

1. Go to <https://supabase.com/dashboard> → **New project**. Pick a name (e.g. `daybook`), a strong database password and the region closest to you (e.g. *West EU (London)*).
2. Wait for it to finish provisioning.
3. Open **Project Settings → API** (or click **Connect** at the top) and copy:
   - **Project URL**: `https://<ref>.supabase.co`
   - **anon / publishable key**

### 2. Run the database migration

1. In Supabase, open **SQL Editor → New query**.
2. Paste the whole of [`supabase/migrations/20261027000000_init.sql`](supabase/migrations/20261027000000_init.sql) and click **Run**.
3. Check **Table Editor**. You should see `settings`, `days`, `tasks`, `goals`, `month_notes` and `year_notes`, all marked **RLS enabled**.

(If you use the Supabase CLI instead: `supabase link --project-ref <ref>` then `supabase db push`.)

### 3. Create a Google OAuth client

1. Go to <https://console.cloud.google.com> and create a project (or pick an existing one).
2. **APIs & Services → OAuth consent screen** (also called *Google Auth Platform*):
   - User type **External** → fill in the app name (`Daybook`), support email and developer email → save.
   - Under **Audience**, publish the app (**In production**) so that anyone can sign in. While it's in *Testing*, only the test users you list can sign in.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - **Authorised JavaScript origins**: your site URL, e.g. `https://daybook-xyz.vercel.app` (and `http://localhost:3000` for local development)
   - **Authorised redirect URIs**: `https://<ref>.supabase.co/auth/v1/callback` (this exact URL is shown in Supabase on the Google provider page)
4. Copy the **Client ID** and **Client secret**.

### 4. Enable the Google provider in Supabase

1. Supabase → **Authentication → Sign In / Providers → Google** → enable.
2. Paste the Client ID and Client secret → **Save**.
3. Email sign-in (magic link) is on by default under **Email**. Leave it enabled.

> Supabase's built-in email service is heavily rate-limited (a handful of emails an hour). If lots of people will use magic links, add your own SMTP provider under **Authentication → Emails → SMTP Settings**.

### 5. Run locally (optional)

```bash
cp .env.example .env.local   # then fill in the two values from step 1
npm install
npm run dev                  # http://localhost:3000
```

For local sign-in to work, add `http://localhost:3000/**` under **Supabase → Authentication → URL Configuration → Redirect URLs**.

### 6. Deploy on Vercel

1. <https://vercel.com/new> → **Import** the `daybook` GitHub repository. The framework is detected as Next.js automatically.
2. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Project URL
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = your publishable key (`sb_publishable_…`). On older projects, `NEXT_PUBLIC_SUPABASE_ANON_KEY` with the anon key also works.
3. Click **Deploy** and note your URL, e.g. `https://daybook-xyz.vercel.app`.

### 7. Add the Vercel URL to Supabase

Supabase → **Authentication → URL Configuration**:

- **Site URL**: `https://daybook-xyz.vercel.app`
- **Redirect URLs**: add `https://daybook-xyz.vercel.app/**`

Also add the same URL to the Google OAuth client's **Authorised JavaScript origins** if you didn't in step 3. You're done: open the site and sign in.

### 8. Install it as an app

- **iPhone (Safari):** open the site → Share → **Add to Home Screen**.
- **Mac (Safari 17+):** File → **Add to Dock**. **Chrome:** the install icon in the address bar.

Tip: magic links open in your default browser. On iPhone, sign in with Google from inside the home-screen app, or open the magic link in Safari first and then add to Home Screen.

## How it works

- **Privacy:** every table has `user_id` and Row Level Security policies (`user_id = auth.uid()`) for select, insert, update and delete. The `anon` role has no table access at all.
- **Starter data:** on first sign-in the app creates your settings with the default habits, categories and goal areas. You can edit all of them in Setup.
- **Optimistic saving:** changes show instantly and are written in order in the background. The header shows *Saving… / Saved / Couldn't save · Reload*.
- **Day score:** (habits ticked + tasks done) ÷ (habits + tasks) for that day.
- **Delete my account:** calls the `delete_my_account()` database function, which removes your rows and your auth user. No service-role key is needed in the app.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript check |

## Never commit secrets

`.env.local` is git-ignored. Only `.env.example` (with placeholder values) is committed. The anon key is safe in the browser because RLS protects the data. Never put the `service_role` key in this app.
