-- Safe to run more than once: existing tables, rows, triggers, and policies are kept or replaced, never dropped with data.
-- Per-user progress (quiz bests and attempts, questions answered correctly, game bests,
-- and unfinished quiz runs), plus admin-controlled quiz ordering.

create table if not exists public.user_progress (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  quiz_best jsonb not null default '{}' check (jsonb_typeof(quiz_best) = 'object'),
  quiz_attempts jsonb not null default '{}' check (jsonb_typeof(quiz_attempts) = 'object'),
  answered jsonb not null default '{}' check (jsonb_typeof(answered) = 'object'),
  game_best jsonb not null default '{}' check (jsonb_typeof(game_best) = 'object'),
  quiz_runs jsonb not null default '{}' check (jsonb_typeof(quiz_runs) = 'object'),
  updated_at timestamptz not null default now()
);

drop trigger if exists user_progress_touch on public.user_progress;
create trigger user_progress_touch before update on public.user_progress for each row execute function public.touch_updated_at();

alter table public.user_progress enable row level security;

drop policy if exists "Read own progress" on public.user_progress;
create policy "Read own progress" on public.user_progress for select to authenticated using (user_id = auth.uid());
drop policy if exists "Create own progress" on public.user_progress;
create policy "Create own progress" on public.user_progress for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "Update own progress" on public.user_progress;
create policy "Update own progress" on public.user_progress for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- One row per quiz: the three topic quizzes and the mixed review. Both options start off,
-- which keeps the original fixed order until the admin turns them on.
create table if not exists public.quiz_settings (
  quiz text primary key check (quiz in ('trig', 'exp', 'log', 'all')),
  shuffle_questions boolean not null default false,
  shuffle_choices boolean not null default false,
  updated_at timestamptz not null default now()
);

drop trigger if exists quiz_settings_touch on public.quiz_settings;
create trigger quiz_settings_touch before update on public.quiz_settings for each row execute function public.touch_updated_at();

alter table public.quiz_settings enable row level security;

drop policy if exists "Anyone reads quiz settings" on public.quiz_settings;
create policy "Anyone reads quiz settings" on public.quiz_settings for select to anon, authenticated using (true);
drop policy if exists "Admin updates quiz settings" on public.quiz_settings;
create policy "Admin updates quiz settings" on public.quiz_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.quiz_settings (quiz) values ('trig'), ('exp'), ('log'), ('all') on conflict (quiz) do nothing;
