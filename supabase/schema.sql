-- 하이랄 두더지 잡기 - Supabase 스키마
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 실행하세요.

create extension if not exists "pgcrypto";

-- ===== 점수 =====
create table if not exists public.scores (
  id          uuid primary key default gen_random_uuid(),
  player_name text not null check (char_length(player_name) between 1 and 20),
  score       integer not null check (score >= 0 and score <= 100000),
  created_at  timestamptz not null default now()
);

create index if not exists scores_score_idx on public.scores (score desc, created_at asc);

-- ===== 리뷰 =====
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  player_name text not null check (char_length(player_name) between 1 and 20),
  rating      smallint not null check (rating between 1 and 5),
  comment     text not null check (char_length(comment) between 1 and 300),
  created_at  timestamptz not null default now()
);

create index if not exists reviews_created_idx on public.reviews (created_at desc);

-- ===== RLS: 누구나 읽기/추가 가능, 수정/삭제는 불가 =====
alter table public.scores  enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "scores_select_all" on public.scores;
create policy "scores_select_all" on public.scores
  for select to anon, authenticated using (true);

drop policy if exists "scores_insert_all" on public.scores;
create policy "scores_insert_all" on public.scores
  for insert to anon, authenticated with check (true);

drop policy if exists "reviews_select_all" on public.reviews;
create policy "reviews_select_all" on public.reviews
  for select to anon, authenticated using (true);

drop policy if exists "reviews_insert_all" on public.reviews;
create policy "reviews_insert_all" on public.reviews
  for insert to anon, authenticated with check (true);
