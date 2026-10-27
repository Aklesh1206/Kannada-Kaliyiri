-- Kannada Kaliyiri: cloud save and leaderboard.
-- Run this once in Supabase: SQL Editor > New query > paste > Run.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) <= 20),
  level text check (level in ('beginner', 'intermediate', 'advanced')),
  xp integer not null default 0 check (xp >= 0),
  streak integer not null default 0 check (streak >= 0),
  last_active date,
  show_on_leaderboard boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.completed_lessons (
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_key text not null,
  times integer not null default 1 check (times >= 1),
  primary key (user_id, lesson_key)
);

create table if not exists public.review_boxes (
  user_id uuid not null references auth.users (id) on delete cascade,
  phrase_id text not null,
  box integer not null check (box between 1 and 5),
  due date not null,
  primary key (user_id, phrase_id)
);

create table if not exists public.high_scores (
  user_id uuid not null references auth.users (id) on delete cascade,
  game_key text not null,
  score integer not null check (score >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, game_key)
);

-- Row level security: every learner can only touch their own rows.
alter table public.profiles enable row level security;
alter table public.completed_lessons enable row level security;
alter table public.review_boxes enable row level security;
alter table public.high_scores enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own lessons" on public.completed_lessons;
create policy "own lessons" on public.completed_lessons for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own boxes" on public.review_boxes;
create policy "own boxes" on public.review_boxes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own scores" on public.high_scores;
create policy "own scores" on public.high_scores for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Public leaderboard: only a display name and a score, never an email or user id.
-- The view runs with its owner's rights on purpose so it can read every learner's score.
create or replace view public.leaderboard as
  select
    h.game_key,
    h.score,
    coalesce(nullif(p.display_name, ''), 'Learner') as display_name
  from public.high_scores h
  left join public.profiles p on p.user_id = h.user_id
  where coalesce(p.show_on_leaderboard, true);

grant select on public.leaderboard to anon, authenticated;
